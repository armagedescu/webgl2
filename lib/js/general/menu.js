"use strict";
class CHtml
{
   static #toArray (obj) {
      if (!obj) return null;
      if (Array.isArray(obj))
         return obj.length > 0 ? obj : null;
      return [obj];
   }
   static #toArrayListeners (obj) {
      if (!obj) return null;
      if (typeof obj  === "function")
         return [ {name:"click", callback: obj} ];
      return CHtml.#toArray(obj);
   }
   static attachEventListeners(element, listeners) {
      listeners = CHtml.#toArrayListeners(listeners);
      if (!listeners) return;
      for (let listener of CHtml.#toArrayListeners(listeners))
         element.addEventListener (listener.name, listener.callback);
   }
   static createElement(elementName, children) {
      let element = document.createElement (elementName);
      children = CHtml.#toArray(children);
      if (!children) return element;
      for (let child of children)
         element.appendChild (child);
      return element;
   }
   static createElements (elementNames, children)
   {
      elementNames = CHtml.#toArray(elementNames);
      if (!elementNames) return;
      let target = CHtml.createElement (elementNames.pop(), children);
      let current = target;
      while (elementNames.length > 0)
         current = CHtml.createElement (elementNames.pop(), current);
      return {root:current, target:target};
   }
}
class GLMenuTemplate
{
   #style_id    = "webgl_menu_template_style";
   #template_id = "webgl_menu_template";
   #webgl_css   = `
   /*element.class*/
   div.webgl_menu
   {
      position:absolute;z-index:10;border:1px solid black;background-color: #fff;
   }
   /*element.class elements*/
   div.webgl_menu  summary
   {
      background-color: #eee;
      width:            1.3em;
      height:           1.3em;
      border:           solid black thin;
      border-radius:    .3em;
      padding:          0;
      margin:           0;
      align-content:    center;
      text-align:       center;
      cursor:           pointer;
   }
   /*element.class elements*/
   div.webgl_menu  summary::marker  {  content: "+"; }
   div.webgl_menu  summary:hover { background-color:#ddd; }
   div.webgl_menu  details[open] summary::marker { content: "x"; }
   div.webgl_menu  details  table {opacity: 1;}
   `; /*`*/
	//close HEREDOC with comment, some editors can't handle correctly HEREDOC highlighting

   constructor ()
   {
      this.#styleInit();
      this.#templateInit();
   }
   get template () {return document.getElementById(this.#template_id);}

   #styleInit()
   {
      if (document.getElementById (this.#style_id)) return;
      let style = CHtml.createElement("style");
      style.setAttribute ("id", this.#style_id);
      style.textContent = this.#webgl_css;
      document.body.appendChild(style);
      return style;
   }
   #templateInit()
   {
      if (document.getElementById (this.#template_id)) return;
      let div = this.#createMenuDiv();
      //let row     = CHtml.createElements (["tr", "td", "label"]);
      let row     = CHtml.createElements (["tr", "td"]);
      let template = this.#createTemplate (this.#template_id, [div, row.root]);
      document.body.appendChild(template);
   }

   #createTemplate(id, contents)
   {
      let template = CHtml.createElement("template");
      template.setAttribute ("id", id);
      document.body.appendChild(template);
      if (!contents) return template;
      for (let content of contents)
         template.content.appendChild(content);
      return template;
   }
   #createMenuDiv()
   {
      //template for menu item <tr><td><label><input>
      let summary = CHtml.createElement  ("summary");
      let tbody   = CHtml.createElement  ("tbody");
      let table   = CHtml.createElement  ("table", tbody);
      let details = CHtml.createElement  ("details", [summary, table]);
      let div     = CHtml.createElement  ("div", details);
      div.setAttribute ("class", "webgl_menu");
      return div;
   }

}
class GLMenu
{
   #x = 0xffff; #y = 0xffff;
   #rowt    = null;
   #items   = null;
   #tpl     = null;
   #div     = null;
   constructor (x, y, relativeElement)
   {
      let menuTemplate =  new GLMenuTemplate();
      this.#template = menuTemplate.template;
      [this.#x, this.#y] = [window.scrollX + x, window.scrollY + y];
      if (relativeElement)
      {
         let rc = relativeElement.getBoundingClientRect();
         this.#x += rc.left;
         this.#y += rc.top;
      }

      let divt = {div: this.#template.content.querySelector("div")};
      let dive = {div: document.importNode(divt.div, true)};
      [dive.div.style.top, dive.div.style.left] = [this.#y, this.#x];
      this.#div = dive.div;
      document.body.appendChild(dive.div);

      this.#rowt  = {tr: this.#template.content.querySelector("tr")};
      this.#items = dive.div.querySelector ("tbody");
      console.log();

   }
   
   set #template(value) { this.#tpl = value; }
   get #template()      { return this.#tpl; }


   addCheckbox (text, events)
   {
      let input = document.createElement ("input");
      input.setAttribute ("type", "checkbox");
      //input.textContent = text;
      CHtml.attachEventListeners (input, events);

      let rowe  = {tr: document.importNode(this.#rowt.tr, true)};
      let label = CHtml.createElement("label");
      label.textContent = text;
      let tde = rowe.tr.querySelector("td");
      tde.appendChild (input);
      tde.appendChild (label);
      this.#items.appendChild (rowe.tr);
      return input;
   }
   get innerHTML()
   {
      return this.#div.innerHTML;
   }
}



//approximativve template generated by GLMenuTemplate
//<template id="webgl_menu_template">
//   <div class="webgl_menu">
//      <details><summary ></summary>
//         <table>
//            <tbody>
//               <tr><td><input type="checkbox"></input><label>Show line</label></td></tr>
//               <tr><td><input type="checkbox"></input><label>Show line</label></td></tr>
//            </tbody>
//         </table>
//      </details>
//   </div>
//</template>

//approximative template sample hardcoded
//instanciating GLMenuTemplate to enable webgl_menu styles still required, or manually copy/paste the styles
//<template id="webgl_menu_template">
//   <div class="webgl_menu">
//      <details><summary ></summary>
//         <table>
//            <tbody>
//               <tr><td><input type="checkbox"></input><label>Show line</label></td></tr>
//               <tr><td><input type="checkbox"></input><label>Show line</label></td></tr>
//            </tbody>
//         </table>
//      </details>
//   </div>
//</template>

////approximative code
// let template = document.getElementById("webgl_menu_template");
// let divt = {div: template.content.querySelector("div")};
// let dive = {div: document.importNode(divt.div, true)};
// [dive.div.style.top, dive.div.style.left] = [10, 10];
// document.body.appendChild(dive.div);
// console.log (menu1.innerHTML);
// console.log (dive.div.innerHTML);