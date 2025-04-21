type LoadJsonProps<T> = {
  content: string
  fallback: T
}

export const loadJson = <T>({ content, fallback }: LoadJsonProps<T>): T => {
  try {
    return JSON.parse(content);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
};