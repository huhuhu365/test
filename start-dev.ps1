$ErrorActionPreference = 'Stop'

$javaHome = 'C:\Users\study\.jdk\jdk-25.0.2'
$env:JAVA_HOME = $javaHome
$env:PATH = "$javaHome\bin;$env:PATH"

Start-Process -FilePath 'powershell' -ArgumentList '-NoExit','-Command','Set-Location "c:\\wang\\backend"; $env:JAVA_HOME="C:\\Users\\study\\.jdk\\jdk-25.0.2"; $env:PATH="$env:JAVA_HOME\\bin;$env:PATH"; mvn spring-boot:run' -WindowStyle Hidden

Start-Process -FilePath 'powershell' -ArgumentList '-NoExit','-Command','Set-Location "c:\\wang"; npm run dev' -WindowStyle Hidden
