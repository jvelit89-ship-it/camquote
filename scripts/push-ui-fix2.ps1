$ErrorActionPreference = "Stop"
& "C:\Program Files\Git\cmd\git.exe" stash
& "C:\Program Files\Git\cmd\git.exe" pull --rebase origin main
& "C:\Program Files\Git\cmd\git.exe" push origin main
& "C:\Program Files\Git\cmd\git.exe" stash pop
