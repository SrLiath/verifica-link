package main
import (
    "encoding/json"
    "flag"
    "fmt"
    "log"
    "net/url"
    "time"
    "github.com/go-routeros/routeros"
    "github.com/gorilla/websocket"
)
var (
    ip       = flag.String("ip", "192.168.1.1:8728", "IP e porta do roteador MikroTik")
    user     = flag.String("user", "admin", "Usuário do MikroTik")
    password = flag.String("pass", "senha", "Senha do usuário")
    token    = flag.String("token", "", "Token de autenticação para o Websocket")
    wsURL    = flag.String("ws", "ws://localhost:8080/ws", "URL do servidor Websocket")
    delay    = flag.Int("delay", 1, "Intervalo em segundos entre os envios de dados")
)
func toJson(data interface{}) ([]byte, error) {
    return json.MarshalIndent(data, "", "  ")
}
func connectWebsocket(token string) (*websocket.Conn, error) {
    u, _ := url.Parse(*wsURL)
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
func main() {
    flag.Parse()
    if *delay < 1 {
        log.Fatal("O delay deve ser pelo menos 1 segundo.")
    }
    
    client, err := routeros.Dial(*ip, *user, *password)
    if err != nil {
        log.Fatalf("Erro ao conectar ao MikroTik: %v", err)
    }
    defer client.Close()
    
    if *token == "" {
        ticker := time.NewTicker(time.Second * time.Duration(*delay))
        defer ticker.Stop()
        for {
            select {
            case <-ticker.C:
                reply, err := client.Run("/interface/ethernet/print")
                if err != nil {
                    log.Println("Erro ao executar comando no MikroTik:", err)
                    continue
                }
                jsonData, _ := toJson(reply)
                log.Printf("Dados locais (a cada %d seg):", *delay)
                log.Println(string(jsonData))
            }
        }
    }
    
    wsConn, err := connectWebsocket(*token)
    if err != nil {
        log.Fatalf("Erro ao conectar ao Websocket: %v", err)
    }
    defer wsConn.Close()
    
    ticker := time.NewTicker(time.Second * time.Duration(*delay))
    defer ticker.Stop()
    for {
        select {
        case <-ticker.C:
            
            reply, err := client.Run("/interface/ethernet/print")
            if err != nil {
                log.Println("Erro ao executar comando no MikroTik:", err)
                continue
            }
            
            jsonData, _ := toJson(reply)
            
            err = wsConn.WriteMessage(websocket.TextMessage, jsonData)
            if err != nil {
                log.Fatalf("Erro ao enviar mensagem pelo Websocket: %v", err)
            }
            log.Printf("JSON enviado via Websocket (a cada %d seg).", *delay)
        }
    }
}
