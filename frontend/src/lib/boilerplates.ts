export const BOILERPLATES: Record<string, { name: string, code: string }[]> = {
  javascript: [
    { name: 'Express Server (Basic)', code: `const express = require('express');\nconst app = express();\n\napp.use(express.json());\n\napp.get('/', (req, res) => {\n  res.send('CodeForge Express API');\n});\n\napp.listen(3000, () => {\n  console.log('Server running on port 3000');\n});` },
    { name: 'React component', code: `import React, { useState } from 'react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="p-4">\n      <h1 className="text-2xl font-bold">Counter: {count}</h1>\n      <button onClick={() => setCount(count + 1)}>Increment</button>\n    </div>\n  );\n}` },
    { name: 'Binary Search (Iterative)', code: `function binarySearch(arr, target) {\n  let left = 0;\n  let right = arr.length - 1;\n\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}` }
  ],
  python: [
    { name: 'Flask Web API', code: `from flask import Flask, jsonify\n\napp = Flask(__name__)\n\n@app.route('/')\ndef home():\n    return jsonify({"message": "Hello from CodeForge"})\n\nif __name__ == '__main__':\n    app.run(port=5000, debug=True)` },
    { name: 'Data Sci (Matplotlib)', code: `import matplotlib.pyplot as plt\nimport numpy as np\n\n# Generate coordinates\nx = np.linspace(0, 10, 100)\ny = np.sin(x)\n\nplt.plot(x, y, linewidth=2.0)\nplt.title('Sine Wave')\nplt.grid(True)\nplt.show()` },
    { name: 'Binary Search (Recursive)', code: `def binary_search(arr, low, high, x):\n    if high >= low:\n        mid = (high + low) // 2\n        if arr[mid] == x:\n            return mid\n        elif arr[mid] > x:\n            return binary_search(arr, low, mid - 1, x)\n        else:\n            return binary_search(arr, mid + 1, high, x)\n    else:\n        return -1` }
  ],
  cpp: [
    { name: 'Standard Skeleton', code: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    cout << "Hello, CodeForge!" << endl;\n    return 0;\n}` },
    { name: 'Dijkstra Algorithm', code: `// Dijkstra's Shortest Path Algorithm\n#include <iostream>\n#include <vector>\n#include <queue>\nusing namespace std;\n\n#define INF 0x3f3f3f3f\n\nvoid dijkstra(vector<vector<pair<int, int>>>& graph, int src) {\n    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;\n    vector<int> dist(graph.size(), INF);\n    \n    pq.push(make_pair(0, src));\n    dist[src] = 0;\n    \n    while (!pq.empty()) {\n        int u = pq.top().second;\n        pq.pop();\n        \n        for (auto x : graph[u]) {\n            int v = x.first;\n            int weight = x.second;\n            \n            if (dist[v] > dist[u] + weight) {\n                dist[v] = dist[u] + weight;\n                pq.push(make_pair(dist[v], v));\n            }\n        }\n    }\n}` }
  ],
  java: [
    { name: 'Spring Boot Main', code: `import org.springframework.boot.SpringApplication;\nimport org.springframework.boot.autoconfigure.SpringBootApplication;\n\n@SpringBootApplication\npublic class Application {\n    public static void main(String[] args) {\n        SpringApplication.run(Application.class, args);\n    }\n}` }
  ],
  rust: [
    { name: 'Actix Web Server', code: `use actix_web::{get, App, HttpResponse, HttpServer, Responder};\n\n#[get("/")]\nasync fn hello() -> impl Responder {\n    HttpResponse::Ok().body("Hello CodeForge!")\n}\n\n#[actix_web::main]\nasync fn main() -> std::io::Result<()> {\n    HttpServer::new(|| {\n        App::new().service(hello)\n    })\n    .bind(("127.0.0.1", 8080))?\n    .run()\n    .await\n}` }
  ],
  go: [
    { name: 'Go HTTP Server', code: `package main\n\nimport (\n\t"fmt"\n\t"net/http"\n)\n\nfunc handler(w http.ResponseWriter, r *http.Request) {\n\tfmt.Fprintf(w, "Hello from CodeForge Go Server!")\n}\n\nfunc main() {\n\thttp.HandleFunc("/", handler)\n\thttp.ListenAndServe(":8080", nil)\n}` }
  ]
};
