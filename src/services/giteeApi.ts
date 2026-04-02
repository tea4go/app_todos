import { TodoData } from '../types';

const GITEE_API_BASE = 'https://gitee.com/api/v5';

export const giteeApi = {
  async createGist(token: string, data: TodoData): Promise<string> {
    const response = await fetch(`${GITEE_API_BASE}/gists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: token,
        description: `团队待办事项 - ${data.team}`,
        public: false,
        files: {
          'todos.json': {
            content: JSON.stringify(data, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`创建代码片段失败: ${response.status} ${text}`);
    }

    const result = await response.json();
    return result.id;
  },

  async fetchGist(gistId: string, token: string): Promise<TodoData> {
    const response = await fetch(
      `${GITEE_API_BASE}/gists/${gistId}?access_token=${token}`,
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`获取代码片段失败: ${response.status} ${text}`);
    }

    const result = await response.json();
    const file = result.files?.['todos.json'];
    if (!file?.content) {
      throw new Error('代码片段中未找到 todos.json');
    }

    return JSON.parse(file.content);
  },

  async updateGist(gistId: string, token: string, data: TodoData): Promise<void> {
    const response = await fetch(`${GITEE_API_BASE}/gists/${gistId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: token,
        files: {
          'todos.json': {
            content: JSON.stringify(data, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`更新代码片段失败: ${response.status} ${text}`);
    }
  },
};
