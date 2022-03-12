$port = 27015
$ip = "127.0.0.1"
#$listener = [System.Net.Sockets.TcpListener]$port
#$listener.Start();
echo $ip
Test-NetConnection -ComputerName $ip -Port $port