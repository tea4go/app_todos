import { giteeApi } from '../../src/services/giteeApi';
import { TodoData } from '../../src/types';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const SAMPLE_DATA: TodoData = {
  team: '测试团队',
  members: ['alice', 'bob'],
  todos: [],
};

describe('giteeApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGist', () => {
    it('should create a gist and return its id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'gist-123' }),
      });

      const id = await giteeApi.createGist('test-token', SAMPLE_DATA);

      expect(id).toBe('gist-123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitee.com/api/v5/gists',
        expect.objectContaining({
          method: 'POST',
        }),
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.access_token).toBe('test-token');
      expect(callBody.description).toBe('团队待办事项 - 测试团队');
      expect(callBody.public).toBe(false);
      expect(JSON.parse(callBody.files['todos.json'].content)).toEqual(SAMPLE_DATA);
    });

    it('should throw on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      await expect(giteeApi.createGist('bad-token', SAMPLE_DATA)).rejects.toThrow(
        '创建代码片段失败: 401',
      );
    });
  });

  describe('fetchGist', () => {
    it('should fetch and parse gist content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            files: {
              'todos.json': {
                content: JSON.stringify(SAMPLE_DATA),
              },
            },
          }),
      });

      const data = await giteeApi.fetchGist('gist-123', 'test-token');

      expect(data).toEqual(SAMPLE_DATA);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitee.com/api/v5/gists/gist-123?access_token=test-token',
      );
    });

    it('should throw when todos.json not found in gist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ files: {} }),
      });

      await expect(
        giteeApi.fetchGist('gist-123', 'test-token'),
      ).rejects.toThrow('代码片段中未找到 todos.json');
    });

    it('should throw on network error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Not Found'),
      });

      await expect(
        giteeApi.fetchGist('bad-id', 'test-token'),
      ).rejects.toThrow('获取代码片段失败: 404');
    });
  });

  describe('updateGist', () => {
    it('should update gist content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await giteeApi.updateGist('gist-123', 'test-token', SAMPLE_DATA);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitee.com/api/v5/gists/gist-123',
        expect.objectContaining({
          method: 'PATCH',
        }),
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.access_token).toBe('test-token');
      expect(JSON.parse(callBody.files['todos.json'].content)).toEqual(SAMPLE_DATA);
    });

    it('should throw on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server Error'),
      });

      await expect(
        giteeApi.updateGist('gist-123', 'test-token', SAMPLE_DATA),
      ).rejects.toThrow('更新代码片段失败: 500');
    });
  });
});
