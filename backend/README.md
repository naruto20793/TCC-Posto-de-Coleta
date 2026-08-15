# Backend — Instruções rápidas para MongoDB e extensão VS Code

Este documento explica como usar a extensão "MongoDB for VS Code" para conectar ao banco e fazer o backend usar um MongoDB persistente.

1) Preparar variáveis de ambiente
- Copie `.env.example` para `.env` dentro da pasta `backend` e ajuste `MONGODB_URI` para sua instância local ou Atlas.

2) Iniciar MongoDB local (opções):
- Se instalou o MongoDB como serviço (Windows): abra PowerShell como administrador e rode:

  net start MongoDB

- Se usa binários e quer iniciar manualmente (substitua o caminho e dbpath):

  "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe" --dbpath "C:\\data\\db"

3) Iniciar backend
- Na pasta `backend` rode:

  npm install
  npm run dev

O servidor por padrão usa `mongodb-memory-server` quando `MONGODB_URI` não está definido; definindo `MONGODB_URI` no `.env` fará o app conectar no seu MongoDB persistente.

4) Conectar usando a extensão "MongoDB for VS Code"
- Abra o VS Code.
- Abra a aba lateral da extensão MongoDB (ícone de banco de dados) ou pressione `Ctrl+Shift+P` e escolha `MongoDB: Connect`.
- Clique em `Add Connection` ou `Create Connection`.
- Cole sua conexão (ex.: `mongodb://localhost:27017` ou a URI do Atlas) e clique em `Connect`.
- A conexão aparecerá no painel; expanda para ver databases, collections e documentos.
- Para abrir um playground (rodar queries), clique com direito em uma database/collection e escolha `New Playground`.

5) Testar a API
- Verifique o endpoint de health:

  curl http://localhost:5000/api/health

6) Dicas
- Não salve credenciais em repositórios públicos. Use `.env` e adicione-o ao `.gitignore`.
- Se precisar inspecionar dados criados pelo app, conecte ao mesmo `MONGODB_URI` que o backend está usando.

Se quiser, eu crio um arquivo de conexão para o VS Code (`.vscode/settings.json`) com uma entrada de exemplo (atenção: isso pode expor a URI no repo).

## Iniciar `mongod` no Windows (comandos exatos)

1) Verificar se há um serviço instalado para o MongoDB:

```powershell
Get-Service -Name *mongo* -ErrorAction SilentlyContinue | Format-Table -AutoSize
```

Se o comando listar um serviço (por exemplo `MongoDB`), inicie-o com:

```powershell
Start-Service -Name MongoDB
net start MongoDB
```

2) Se não houver serviço instalado, localize o executável `mongod.exe` e inicie-o apontando um `dbpath` (exemplo comum):

```powershell
New-Item -ItemType Directory -Path C:\data\db -Force
& 'C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe' --dbpath 'C:\data\db'
Start-Process -FilePath 'C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe' -ArgumentList '--dbpath','C:\data\db' -NoNewWindow
```

3) Checar se o MongoDB está escutando na porta padrão 27017:

```powershell
netstat -ano | Select-String '27017'
# ou
Get-Process -Id (Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue).OwningProcess
```

4) Após iniciar o `mongod`, atualize `backend/.env` com a URI:

```
MONGODB_URI=mongodb://localhost:27017/posto-coleta
```

5) Reinicie o backend (`npm run dev`) e conecte pela extensão do VS Code.

## Tarefa do VS Code para iniciar `mongod` (exemplo)

Crie o arquivo `.vscode/tasks.json` com o conteúdo de exemplo abaixo e atualize o caminho para seu `mongod.exe`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start mongod (edit path)",
      "type": "shell",
      "command": "\"C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe\" --dbpath C:\\data\\db",
      "problemMatcher": []
    }
  ]
}
```

Depois de editar o caminho, abra o painel `Terminal` → `Run Task...` e escolha `Start mongod (edit path)`.