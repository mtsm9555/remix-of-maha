import type { APIEndpoint, CodeExample } from "./APIDocumentationTypes";

export class CodeExampleGenerator {
  static generateExamples(endpoint: APIEndpoint, baseUrl: string, authToken?: string): CodeExample[] {
    return [
      this.curl(endpoint, baseUrl, authToken),
      this.js(endpoint, baseUrl, authToken),
      this.ts(endpoint, baseUrl, authToken),
      this.py(endpoint, baseUrl, authToken),
      this.go(endpoint, baseUrl, authToken),
    ];
  }

  private static curl(e: APIEndpoint, baseUrl: string, token?: string): CodeExample {
    const url = this.buildUrl(e, baseUrl);
    let c = `curl -X ${e.method} '${url}' \\\n  -H 'Content-Type: application/json'`;
    if (token) c += ` \\\n  -H 'Authorization: Bearer ${token}'`;
    const body = e.requestBody?.content['application/json']?.example;
    if (body !== undefined) c += ` \\\n  -d '${JSON.stringify(body, null, 2)}'`;
    return { language: 'curl', code: c, description: 'cURL command' };
  }

  private static js(e: APIEndpoint, baseUrl: string, token?: string): CodeExample {
    const url = this.buildUrl(e, baseUrl);
    let c = `const response = await fetch('${url}', {\n  method: '${e.method}',\n  headers: {\n    'Content-Type': 'application/json',\n`;
    if (token) c += `    'Authorization': 'Bearer ${token}',\n`;
    c += `  },\n`;
    const body = e.requestBody?.content['application/json']?.example;
    if (body !== undefined) c += `  body: JSON.stringify(${JSON.stringify(body, null, 4)})\n`;
    c += `});\n\nconst data = await response.json();\nconsole.log(data);`;
    return { language: 'javascript', code: c, description: 'JavaScript (Fetch API)' };
  }

  private static ts(e: APIEndpoint, baseUrl: string, token?: string): CodeExample {
    const url = this.buildUrl(e, baseUrl);
    let c = `interface ResponseData {\n  // Define response type based on schema\n}\n\nconst response = await fetch('${url}', {\n  method: '${e.method}',\n  headers: {\n    'Content-Type': 'application/json',\n`;
    if (token) c += `    'Authorization': 'Bearer ${token}',\n`;
    c += `  },\n`;
    const body = e.requestBody?.content['application/json']?.example;
    if (body !== undefined) c += `  body: JSON.stringify(${JSON.stringify(body, null, 4)})\n`;
    c += `});\n\nconst data: ResponseData = await response.json();\nconsole.log(data);`;
    return { language: 'typescript', code: c, description: 'TypeScript (Fetch API)' };
  }

  private static py(e: APIEndpoint, baseUrl: string, token?: string): CodeExample {
    const url = this.buildUrl(e, baseUrl);
    const method = e.method.toLowerCase();
    let c = `import requests\n\nurl = '${url}'\nheaders = {\n    'Content-Type': 'application/json',\n`;
    if (token) c += `    'Authorization': 'Bearer ${token}'\n`;
    c += `}\n\n`;
    const body = e.requestBody?.content['application/json']?.example;
    if (body !== undefined) {
      c += `data = ${JSON.stringify(body, null, 4)}\n\nresponse = requests.${method}(url, headers=headers, json=data)\n`;
    } else {
      c += `response = requests.${method}(url, headers=headers)\n`;
    }
    c += `\nprint(response.json())`;
    return { language: 'python', code: c, description: 'Python (requests library)', dependencies: ['requests'] };
  }

  private static go(e: APIEndpoint, baseUrl: string, token?: string): CodeExample {
    const url = this.buildUrl(e, baseUrl);
    let c = `package main\n\nimport (\n    "bytes"\n    "encoding/json"\n    "fmt"\n    "io/ioutil"\n    "net/http"\n)\n\nfunc main() {\n    url := "${url}"\n`;
    const body = e.requestBody?.content['application/json']?.example;
    if (body !== undefined) {
      c += `    data := ${JSON.stringify(body)}\n    jsonData, _ := json.Marshal(data)\n    req, _ := http.NewRequest("${e.method}", url, bytes.NewBuffer(jsonData))\n`;
    } else {
      c += `    req, _ := http.NewRequest("${e.method}", url, nil)\n`;
    }
    c += `    req.Header.Set("Content-Type", "application/json")\n`;
    if (token) c += `    req.Header.Set("Authorization", "Bearer ${token}")\n`;
    c += `\n    client := &http.Client{}\n    resp, _ := client.Do(req)\n    defer resp.Body.Close()\n\n    body, _ := ioutil.ReadAll(resp.Body)\n    fmt.Println(string(body))\n}`;
    return { language: 'go', code: c, description: 'Go (net/http)' };
  }

  private static buildUrl(endpoint: APIEndpoint, baseUrl: string): string {
    let path = endpoint.path;
    for (const p of endpoint.parameters) {
      if (p.in === 'path') {
        const ex = p.example ?? `{${p.name}}`;
        path = path.replace(`{${p.name}}`, String(ex));
      }
    }
    return `${baseUrl}${path}`;
  }
}