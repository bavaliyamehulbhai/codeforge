export interface ProjectTemplate {
  id: string
  title: string
  description: string
  language: string
  code: string
  category: 'Modern Web' | 'Algorithms' | 'Automation' | 'Data Science'
}

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: 'todo-app-js',
    title: 'Command Line Todo App',
    description: 'A complete functional Todo list manager for the terminal.',
    language: 'javascript',
    category: 'Modern Web',
    code: `// Simple CLI Todo App
const todos = [];

function addTodo(task) {
  todos.push({ task, completed: false, id: Date.now() });
  console.log(\`Added: "\${task}"\`);
}

function completeTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = true;
    console.log(\`Completed: "\${todo.task}"\`);
  }
}

function listTodos() {
  console.log("\\n--- My Tasks ---");
  todos.forEach((t, i) => {
    console.log(\`\${i + 1}. [\${t.completed ? 'X' : ' '}] \${t.task}\`);
  });
}

addTodo("Learn MERN Stack");
addTodo("Build CodeForge");
completeTodo(todos[0].id);
listTodos();
`
  },
  {
    id: 'weather-script-py',
    title: 'Weather Data Processor',
    description: 'Processes weather data and calculates averages and extremes.',
    language: 'python',
    category: 'Data Science',
    code: `# Weather Data Processor
weather_data = [
    {"day": "Mon", "temp": 22, "condition": "Sunny"},
    {"day": "Tue", "temp": 19, "condition": "Cloudy"},
    {"day": "Wed", "temp": 25, "condition": "Sunny"},
    {"day": "Thu", "temp": 28, "condition": "Hot"},
    {"day": "Fri", "temp": 21, "condition": "Rainy"}
]

def analyze_weather(data):
    temps = [d['temp'] for d in data]
    avg_temp = sum(temps) / len(temps)
    max_temp = max(temps)
    
    print(f"Average Temperature: {avg_temp:.1f}°C")
    print(f"Highest Temperature: {max_temp}°C")
    
    sunny_days = [d['day'] for d in data if d['condition'] == 'Sunny']
    print(f"Sunny Days: {', '.join(sunny_days)}")

analyze_weather(weather_data)
`
  },
  {
    id: 'sorting-visualizer-cpp',
    title: 'Binary Search Implementation',
    description: 'Efficient searching algorithm with step-by-step logging.',
    language: 'cpp',
    category: 'Algorithms',
    code: `#include <iostream>
#include <vector>
#include <algorithm>

int binarySearch(const std::vector<int>& arr, int target) {
    int left = 0;
    int right = arr.size() - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        std::cout << "Checking index " << mid << " (value: " << arr[mid] << ")..." << std::endl;
        
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    
    return -1;
}

int main() {
    std::vector<int> data = {1, 3, 5, 7, 9, 11, 13, 15, 17, 19};
    int target = 13;
    
    std::cout << "Searching for " << target << " in sorted array..." << std::endl;
    int result = binarySearch(data, target);
    
    if (result != -1) {
        std::cout << "Found " << target << " at index " << result << std::endl;
    } else {
        std::cout << target << " not found in array." << std::endl;
    }
    
    return 0;
}
`
  }
];
