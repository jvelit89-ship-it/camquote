$ErrorActionPreference = "Stop"
& "C:\Program Files\Git\cmd\git.exe" pull --rebase origin main
& "C:\Program Files\Git\cmd\git.exe" add "src/app/layout.tsx"
& "C:\Program Files\Git\cmd\git.exe" add "src/app/(dashboard)/layout.tsx"
& "C:\Program Files\Git\cmd\git.exe" commit -m "fix(ui): remove duplicate toaster and disable adsense"
& "C:\Program Files\Git\cmd\git.exe" push origin main
