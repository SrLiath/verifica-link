package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/go-routeros/routeros"
	"github.com/gorilla/websocket"
)

type Config struct {
	IP       string `json:"ip"`
	User     string `json:"user"`
	Password string `json:"pass"`
	Token    string `json:"token"`
	WS       string `json:"ws"`
	Delay    int    `json:"delay"`
	Service  string `json:"service"`
}

func loadConfig() (*Config, error) {
	data, err := os.ReadFile("config.json")
	if err != nil {
		return nil, fmt.Errorf("erro ao ler config.json: %w", err)
	}
	var cfg Config
	err = json.Unmarshal(data, &cfg)
	if err != nil {
		return nil, fmt.Errorf("erro ao decodificar config.json: %w", err)
	}
	if cfg.Delay < 1 {
		cfg.Delay = 1
	}
	return &cfg, nil
}

func connectWebsocket(wsURL string, token string) (*websocket.Conn, error) {
	u, _ := url.Parse(wsURL)
	q := u.Query()
	q.Set("token", token)
	u.RawQuery = q.Encode()
	log.Printf("Conectando ao Websocket: %s", u.String())
	conn, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("falha na conexão com o websocket: %w", err)
	}
	return conn, nil
}

func listWindowsServices() ([]string, error) {
	cmd := exec.Command("powershell.exe", "-Command", "Get-Service | Where-Object { $_.Status -eq 'Running' } | Select-Object -ExpandProperty Name")
	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("falha ao executar Get-Service: %v", err)
	}

	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	var services []string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" {
			services = append(services, line)
		}
	}

	return services, nil
}

func isServiceRunning(serviceName string) bool {
	if serviceName == "" || serviceName == "Nenhum serviço" {
		return false
	}
	services, err := listWindowsServices()
	if err != nil {
		log.Printf("Erro ao listar serviços: %v", err)
		return false
	}
	for _, s := range services {
		if s == serviceName {
			return true
		}
	}
	return false
}

func main() {
	cfg, err := loadConfig()
	if err != nil {
		log.Fatal(err)
	}

	client, err := routeros.Dial(cfg.IP, cfg.User, cfg.Password)
	if err != nil {
		log.Fatalf("Erro ao conectar ao MikroTik: %v", err)
	}
	defer client.Close()

	if cfg.Token == "" {
		ticker := time.NewTicker(time.Second * time.Duration(cfg.Delay))
		defer ticker.Stop()
		for range ticker.C {
			reply, err := client.Run("/interface/ethernet/print")
			if err != nil {
				log.Println("Erro ao executar comando no MikroTik:", err)
				continue
			}
			jsonData, err := json.MarshalIndent(reply, "", "  ")
			if err != nil {
				log.Println("Erro ao converter para JSON:", err)
				continue
			}
			serviceRunning := isServiceRunning(cfg.Service)
			log.Printf("Serviço '%s' está rodando: %v", cfg.Service, serviceRunning)
			log.Printf("Dados do MikroTik (a cada %d seg):\n%s", cfg.Delay, string(jsonData))
		}
		return
	}

	wsConn, err := connectWebsocket(cfg.WS, cfg.Token)
	if err != nil {
		log.Fatalf("Erro ao conectar ao WebSocket: %v", err)
	}
	defer wsConn.Close()

	ticker := time.NewTicker(time.Second * time.Duration(cfg.Delay))
	defer ticker.Stop()
	for range ticker.C {
		reply, err := client.Run("/interface/ethernet/print")
		if err != nil {
			log.Println("Erro ao executar comando no MikroTik:", err)
			continue
		}

		serviceRunning := isServiceRunning(cfg.Service)

		data := map[string]interface{}{
			"timestamp":       time.Now().Format(time.RFC3339),
			"mikrotik_reply":  reply,
			"service":         cfg.Service,
			"service_running": serviceRunning,
		}

		jsonData, err := json.MarshalIndent(data, "", "  ")
		if err != nil {
			log.Println("Erro ao converter para JSON:", err)
			continue
		}

		err = wsConn.WriteMessage(websocket.TextMessage, jsonData)
		if err != nil {
			log.Fatalf("Erro ao enviar mensagem pelo WebSocket: %v", err)
		}
		log.Printf("JSON enviado via WebSocket (a cada %d seg). Serviço '%s' está rodando: %v", cfg.Delay, cfg.Service, serviceRunning)
	}
}
