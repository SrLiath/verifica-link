package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"fyne.io/fyne/v2"
	"golang.org/x/sys/windows/registry"

	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/widget"
)

type Config struct {
	IP       string `json:"ip"`
	User     string `json:"user"`
	Password string `json:"pass"`
	Token    string `json:"token"`
	WsURL    string `json:"ws"`
	Delay    int    `json:"delay"`
	Service  string `json:"service"` // Novo campo
}

func copyFile(src, dst string) error {
	srcFile, _ := os.Open(src)
	defer srcFile.Close()

	dstFile, _ := os.Create(dst)
	defer dstFile.Close()

	_, err := io.Copy(dstFile, srcFile)
	return err
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

	if len(services) == 0 {
		return nil, fmt.Errorf("nenhum serviço encontrado")
	}

	return services, nil
}

func setStartup(appName, appPath string) error {
	key, _, err := registry.CreateKey(registry.CURRENT_USER, `Software\Microsoft\Windows\CurrentVersion\Run`, registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer key.Close()

	return key.SetStringValue(appName, fmt.Sprintf(`"%s"`, appPath))
}

func main() {
	myApp := app.New()
	win := myApp.NewWindow("Instalador")

	ipEntry := widget.NewEntry()
	ipEntry.SetText("192.168.1.1:8728")

	userEntry := widget.NewEntry()
	userEntry.SetText("admin")

	passEntry := widget.NewPasswordEntry()
	passEntry.SetText("senha")

	tokenEntry := widget.NewEntry()

	wsEntry := widget.NewEntry()
	wsEntry.SetText("ws://localhost:8080/ws")

	delayEntry := widget.NewEntry()
	delayEntry.SetText("1")

	form := container.NewVBox(
		widget.NewForm(
			widget.NewFormItem("IP e porta", ipEntry),
			widget.NewFormItem("Usuário", userEntry),
			widget.NewFormItem("Senha", passEntry),
			widget.NewFormItem("Token", tokenEntry),
			widget.NewFormItem("WebSocket URL", wsEntry),
			widget.NewFormItem("Delay (s)", delayEntry),
		),
		widget.NewButton("Instalar", func() {
			delay, err := strconv.Atoi(delayEntry.Text)
			if err != nil {
				dialog.ShowError(fmt.Errorf("Delay inválido"), win)
				return
			}

			// Listar serviços
			services, err := listWindowsServices()
			if err != nil {
				services = []string{"Nenhum serviço"}
			} else {
				services = append([]string{"Nenhum serviço"}, services...)
			}

			selectedService := ""
			dlg := dialog.NewCustomConfirm("Selecione um serviço",
				"Ok", "Cancelar",
				widget.NewSelect(services, func(value string) {
					selectedService = value
				}),
				func(b bool) {
					if b && selectedService != "" {
						// Continuar instalação com serviço selecionado
						home, _ := os.UserHomeDir()
						installPath := filepath.Join(home, "mikrotik")
						os.MkdirAll(installPath, 0755)

						exePath := filepath.Join(installPath, "mikrotik.exe")
						copyFile("mikrotik.exe", exePath)

						cfg := Config{
							IP:       ipEntry.Text,
							User:     userEntry.Text,
							Password: passEntry.Text,
							Token:    tokenEntry.Text,
							WsURL:    wsEntry.Text,
							Delay:    delay,
							Service:  selectedService,
						}

						cfgFile := filepath.Join(installPath, "config.json")
						f, _ := os.Create(cfgFile)
						defer f.Close()
						json.NewEncoder(f).Encode(cfg)

						err := setStartup("mikrotik", exePath)
						if err != nil {
							dialog.ShowError(fmt.Errorf("Erro ao configurar inicialização automática: %v", err), win)
						}

						dialog.ShowInformation("Sucesso", "Instalado com sucesso!", win)
						go func() {
							<-time.After(2 * time.Second)
							myApp.Quit()
						}()
					} else {
						dialog.ShowInformation("Cancelado", "Nenhum serviço selecionado.", win)
					}
				}, win)

			dlg.Show()
		}),
	)

	win.SetContent(form)

	win.Resize(fyne.NewSize(600, 300))
	win.ShowAndRun()

}
