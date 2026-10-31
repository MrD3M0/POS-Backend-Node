$root = 'C:\Users\user\OneDrive\Documents\GitHub\COLLIFY\POS-Backend-Node'
Get-ChildItem "$root\src\modules" | ForEach-Object {
    $name = $_.Name
    $routesFile = Join-Path $_.FullName 'routes.ts'
    if (Test-Path $routesFile) {
        $content = Get-Content $routesFile -Raw
        $lines = ($content | Measure-Object -Line).Lines
        Write-Output ("OK: " + $name + " (" + $lines + " lines)")
    } else {
        Write-Output ("MISSING ROUTES: " + $name)
    }
}