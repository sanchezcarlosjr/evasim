export function save(query: string, expression: string) {
  const url = new URL(window.location.toString());
  url.searchParams.set(query, btoa(retrieve(query)+";"+expression));
  window.history.pushState({}, "", url);
  return expression;
}

export function retrieve(query: string, defaultValue="") {
  return atob((new URL(document.location.toString())).searchParams.get(query) || defaultValue);
}

export function retrieveTemporally(key: string) {
  return sessionStorage.getItem(key);
}

export function saveTemporally(key: string, value: string | null) : string | null {
  if (!value)
    return null;
  sessionStorage.setItem(key, value);
  return value;
}
