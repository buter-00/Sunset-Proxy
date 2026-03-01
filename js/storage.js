const Storage = {};

Storage._get = keys => new Promise(r => chrome.storage.local.get(keys, r));
Storage._set = obj => new Promise(r => chrome.storage.local.set(obj, r));
Storage._remove = keys => new Promise(r => chrome.storage.local.remove(keys, r));

Storage.getAuth = async () => {
  const { username = '', password = '' } = await Storage._get(['username', 'password']);
  return { username, password };
};

Storage.hasCreds = async () => {
  const { username, password } = await Storage._get(['username', 'password']);
  return !!(username && password);
};

Storage.saveCreds = (username, password) => Storage._set({ username, password });
Storage.clearCreds = () => Storage._remove(['username', 'password']);

Storage.get = Storage._get;
Storage.set = Storage._set;
Storage.remove = Storage._remove;

