export const LANGUAGES = [
  {
    id: 63, name: 'JavaScript', value: 'javascript',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    color: '#f7df1e', tagline: 'Interpreted · Scripting · Web',
    defaultCode: `// JavaScript — Welcome to CodeForge!\nconst greet = (name) => {\n  console.log(\`Hello, \${name}! 🚀\`);\n};\n\ngreet('World');\n\nconst nums = [1, 2, 3, 4, 5];\nconst squares = nums.map(n => n * n);\nconsole.log('Squares:', squares);`
  },
  {
    id: 71, name: 'Python', value: 'python',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    color: '#3776ab', tagline: 'Elegant · Data Science · ML',
    defaultCode: `# Python — Welcome to CodeForge!\ndef greet(name: str) -> str:\n    return f"Hello, {name}! 🐍"\n\nprint(greet("World"))\n\nnumbers = [1, 2, 3, 4, 5]\nsquares = [n ** 2 for n in numbers]\nprint(f"Squares: {squares}")`
  },
  {
    id: 54, name: 'C++', value: 'cpp',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
    color: '#00599c', tagline: 'Compiled · Systems · Performance',
    defaultCode: `#include <iostream>\n#include <vector>\n\nint main() {\n    std::cout << "Hello, CodeForge! 🔥" << std::endl;\n\n    std::vector<int> nums = {1, 2, 3, 4, 5};\n    std::cout << "Squares: ";\n    for (int n : nums) std::cout << n * n << " ";\n    std::cout << std::endl;\n\n    return 0;\n}`
  },
  {
    id: 62, name: 'Java', value: 'java',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    color: '#ed8b00', tagline: 'OOP · Enterprise · Cross-Platform',
    defaultCode: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CodeForge! ☕");\n\n        int[] nums = {1, 2, 3, 4, 5};\n        System.out.print("Squares: ");\n        for (int n : nums) {\n            System.out.print(n * n + " ");\n        }\n        System.out.println();\n    }\n}`
  },
  {
    id: 50, name: 'C', value: 'c',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',
    color: '#a8b9cc', tagline: 'Low-level · Embedded · Systems',
    defaultCode: `#include <stdio.h>\n\nint main() {\n    printf("Hello, CodeForge!\\n");\n\n    int nums[] = {1, 2, 3, 4, 5};\n    printf("Squares: ");\n    for (int i = 0; i < 5; i++) {\n        printf("%d ", nums[i] * nums[i]);\n    }\n    printf("\\n");\n\n    return 0;\n}`
  },
  {
    id: 73, name: 'Rust', value: 'rust',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg',
    color: '#ce422b', tagline: 'Memory-Safe · Systems · Fast',
    defaultCode: `fn main() {\n    println!("Hello, CodeForge! 🦀");\n\n    let nums = vec![1, 2, 3, 4, 5];\n    let squares: Vec<i32> = nums.iter().map(|n| n * n).collect();\n    println!("Squares: {:?}", squares);\n}`
  },
  {
    id: 60, name: 'Go', value: 'go',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original-wordmark.svg',
    color: '#00add8', tagline: 'Concurrent · Simple · Cloud-Native',
    defaultCode: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, CodeForge! 🐹")\n\n    nums := []int{1, 2, 3, 4, 5}\n    fmt.Print("Squares: ")\n    for _, n := range nums {\n        fmt.Printf("%d ", n*n)\n    }\n    fmt.Println()\n}`
  },
  {
    id: 83, name: 'Swift', value: 'swift',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg',
    color: '#f05138', tagline: 'iOS · macOS · Modern · Safe',
    defaultCode: `import Foundation\n\nprint("Hello, CodeForge! 🦅")\n\nlet nums = [1, 2, 3, 4, 5]\nlet squares = nums.map { $0 * $0 }\nprint("Squares: \\(squares)")`
  }
]
