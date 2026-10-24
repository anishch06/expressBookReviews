$ curl -s -c cookies.txt -X POST http://localhost:5000/customer/login -H "Content-Type: application/json" -d '{"username":"student4844","password":"pass123"}'
{"message":"User successfully logged in"}
