// options.js

// O namespace 'browser' é o padrão moderno para extensões e funciona no Chrome e Firefox.
const storage = browser.storage.local;

function saveOptions(e) {
  e.preventDefault();
  const identifierValue = document.querySelector("#identifier").value;
  storage.set({
    identifier: identifierValue
  }).then(() => {
    const status = document.querySelector("#status");
    status.textContent = "Salvo com sucesso!";
    setTimeout(() => {
      status.textContent = '';
    }, 1500);
  });
}

function restoreOptions() {
  storage.get("identifier").then((result) => {
    document.querySelector("#identifier").value = result.identifier || '';
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("#save").addEventListener("click", saveOptions);