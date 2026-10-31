$root = 'C:\Users\user\OneDrive\Documents\GitHub\COLLIFY\POS-Backend-Node'
$base = Join-Path $root 'src'
Get-ChildItem (Join-Path $base 'modules') -Directory | ForEach-Object {
    $dir = $_.FullName
    $routes = Join-Path $dir 'routes.ts'
    if (Test-Path $routes) {
        $lines = (Get-Content $routes).Count
        Write-Output ('DIR: OK ' + $_.Name + ' ' + $lines + ' lines')
    } else {
        Write-Output ('DIR: MISSING ' + $_.Name)
    }
}