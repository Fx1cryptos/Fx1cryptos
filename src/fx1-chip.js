// A small label-like chip
class Fx1Chip extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    const span = document.createElement("span");
    span.textContent = this.getAttribute("label") || "Chip";
    span.className = "fx1-chip";
    const style = document.createElement("style");
    style.textContent = `
      @import url("https://cdn.jsdelivr.net/npm/@fx1hubs/brand-css/dist/fx1.css");
    `;
    shadow.appendChild(style);
    shadow.appendChild(span);
  }
}
customElements.define("fx1-chip", Fx1Chip);
