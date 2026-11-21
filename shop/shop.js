// 팅글 시험용 상점 (M6). 실제 판매 없음. 실행 꼬리표 ?run= 과 고장 스위치 ?fail=price_up,slow,wall,soldout 은 탭 안에서 유지된다.
  /* eslint-disable @next/next/no-location-assign-relative-destination -- static page outside Next.js */
(function () {
  "use strict";
  var API = "https://ozberadipgkirxvnqlpl.supabase.co/functions/v1/sean-test-shop";
  var SWITCHES = ["price_up", "slow", "wall", "soldout"];
  var store = window.sessionStorage;
  function read(key, fallback) { try { var value = store.getItem("tingle-shop:" + key); return value === null ? fallback : JSON.parse(value); } catch { return fallback; } }
  function write(key, value) { try { store.setItem("tingle-shop:" + key, JSON.stringify(value)); } catch { /* private mode: state lives in this page only */ } }
  var params = new URLSearchParams(window.location.search);
  if (params.has("run")) write("run", (params.get("run") || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64));
  // Test-only: auth=skip sends the order without the fake identity step (repeat runs without the owner). Not sent to the server.
  if (params.has("auth")) write("authskip", params.get("auth") === "skip");
  if (params.has("fail")) write("switches", (params.get("fail") || "").split(",").filter(function (name) { return SWITCHES.indexOf(name) >= 0; }));
  var run = read("run", ""), switches = read("switches", []);
  function on(name) { return switches.indexOf(name) >= 0; }
  function el(tag, attrs, text) { var node = document.createElement(tag); Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); }); if (text !== undefined) node.textContent = text; return node; }
  function won(amount) { return amount.toLocaleString("ko-KR") + "원"; }
  function main() { return document.getElementById("main"); }
  function link(href, text) { return el("a", { href: href }, text); }
  function cart() { return read("cart", []); }
  function lineTotal(catalog, items, priceUp) {
    return items.reduce(function (sum, item) { var product = catalog.products.find(function (entry) { return entry.id === item.id; }); return sum + (product ? (product.price + (priceUp ? catalog.priceUpAmount : 0)) * item.qty : 0); }, 0);
  }
  function render(page, catalog) {
    var root = main(); root.textContent = "";
    if (on("wall")) {
      root.appendChild(el("h1", {}, "접근이 차단되었습니다"));
      root.appendChild(el("p", {}, "자동화된 접근이 감지되어 이 페이지를 보여 드릴 수 없어요. (시험용 차단 화면)"));
      return;
    }
    var items = cart();
    if (page === "products") {
      root.appendChild(el("h1", {}, "상품"));
      var list = el("ul", {});
      catalog.products.forEach(function (product) {
        var soldout = on("soldout") && product.id === "mug";
        var row = el("li", {});
        row.appendChild(el("span", {}, product.name + " · " + won(product.price) + (soldout ? " · 품절" : "")));
        var add = el("button", { type: "button" }, product.name + " 장바구니 담기");
        if (soldout) add.disabled = true;
        add.addEventListener("click", function () {
          var next = cart(), found = next.find(function (item) { return item.id === product.id; });
          if (found) found.qty = Math.min(5, found.qty + 1); else next.push({ id: product.id, qty: 1 });
          write("cart", next); add.textContent = product.name + " 담았어요";
        });
        row.appendChild(add); list.appendChild(row);
      });
      root.appendChild(list);
      root.appendChild(link("cart.html", "장바구니 보기"));
    } else if (page === "cart") {
      root.appendChild(el("h1", {}, "장바구니"));
      if (!items.length) { root.appendChild(el("p", {}, "장바구니가 비어 있어요.")); root.appendChild(link("index.html", "상품 보러 가기")); return; }
      var lines = el("ul", {});
      items.forEach(function (item) { var product = catalog.products.find(function (entry) { return entry.id === item.id; }); lines.appendChild(el("li", {}, (product ? product.name : item.id) + " × " + item.qty)); });
      root.appendChild(lines);
      root.appendChild(el("p", {}, "상품 금액 " + won(lineTotal(catalog, items, false))));
      root.appendChild(link("checkout.html", "주문서 작성하기"));
    } else if (page === "checkout") {
      root.appendChild(el("h1", {}, "주문서"));
      root.appendChild(el("p", {}, "시험용 주문서예요. 배송은 하지 않아요."));
      var form = el("form", { id: "memo-form" });
      var label = el("label", {}, "배송 메모 ");
      var memo = el("input", { name: "memo", type: "text", value: read("memo", "") });
      label.appendChild(memo); form.appendChild(label);
      var next = el("button", { type: "submit" }, "다음 단계로");
      form.appendChild(next);
      form.addEventListener("submit", function (event) { event.preventDefault(); write("memo", memo.value.slice(0, 100)); window.location.href = "confirm.html"; });
      root.appendChild(form);
    } else if (page === "confirm") {
      root.appendChild(el("h1", {}, "주문 확인"));
      var summary = el("ul", {});
      items.forEach(function (item) { var product = catalog.products.find(function (entry) { return entry.id === item.id; }); summary.appendChild(el("li", {}, (product ? product.name : item.id) + " " + item.qty + "개")); });
      root.appendChild(summary);
      root.appendChild(el("p", {}, "판매처: 팅글 시험용 상점 · 배송: 시험용(배송 없음) · 취소: 시험용 주문이라 취소할 것이 없어요 · 결제수단: 시험용 결제(실제 결제 없음)"));
      var total = el("p", { id: "total" }, "총 결제 금액 " + won(lineTotal(catalog, items, false)));
      root.appendChild(total);
      var current = lineTotal(catalog, items, false);
      if (on("price_up")) setTimeout(function () { current = lineTotal(catalog, items, true); total.textContent = "총 결제 금액 " + won(current) + " (가격이 변경되었어요)"; }, 5000);
      var pay = el("button", { type: "button" }, "결제하기");
      pay.addEventListener("click", function () {
        if (!window.confirm("시험용 주문을 접수할까요? (실제 결제 없음)")) return;
        write("pending", { items: items, total: current });
        window.location.href = "auth.html";
      });
      root.appendChild(pay);
    } else if (page === "auth") {
      root.appendChild(el("h1", {}, "본인 인증 (시험용)"));
      root.appendChild(el("p", {}, "실제 결제였다면 여기서 결제 인증을 해요. 팅글은 이 단계를 직접 하지 않아요."));
      var pending = read("pending", null);
      if (!pending) { root.appendChild(el("p", {}, "확인할 주문이 없어요.")); return; }
      // One key per opened page: network retries are one order, a reopened page is a second order.
      var orderKey = "k" + (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID().replace(/-/g, "") : String(Date.now()) + Math.random().toString(36).slice(2));
      var status = el("p", { role: "status" }, "");
      var verify = el("button", { type: "button" }, "본인 인증하고 결제 완료");
      verify.addEventListener("click", function () {
        verify.disabled = true; status.textContent = "주문을 접수하고 있어요…";
        var body = JSON.stringify({ orderKey: orderKey, run: run, items: pending.items, switches: switches, total: pending.total });
        var attempt = 0;
        (function send() {
          fetch(API + "/orders", { method: "POST", headers: { "content-type": "application/json" }, body: body }).then(function (response) {
            return response.json().then(function (value) { return { ok: response.ok, value: value }; });
          }).then(function (answer) {
            if (!answer.ok) { status.textContent = answer.value && answer.value.error ? answer.value.error : "주문하지 못했어요."; verify.disabled = false; return; }
            write("cart", []); write("pending", null);
            window.location.href = "done.html?order=" + encodeURIComponent(answer.value.orderNumber);
          }).catch(function () { if (++attempt < 3) setTimeout(send, 1000 * attempt); else { status.textContent = "연결을 확인하지 못했어요."; verify.disabled = false; } });
        })();
      });
      root.appendChild(verify); root.appendChild(status);
      if (read("authskip", false) === true) { status.textContent = "시험 설정: 본인 인증 없이 바로 접수해요."; verify.click(); }
    } else if (page === "done") {
      root.appendChild(el("h1", {}, "주문 완료 (시험용)"));
      root.appendChild(el("p", {}, "주문번호 " + (params.get("order") || "").replace(/[^A-Z0-9-]/g, "")));
      root.appendChild(link("orders.html", "주문 내역 보기"));
    } else if (page === "orders") {
      root.appendChild(el("h1", {}, "주문 내역" + (run ? " · " + run : "")));
      var table = el("ul", {}); root.appendChild(table);
      fetch(API + "/orders?run=" + encodeURIComponent(run)).then(function (response) { return response.json(); }).then(function (value) {
        (value.orders || []).forEach(function (order) { table.appendChild(el("li", {}, order.orderNumber + " · " + won(order.total) + " · " + new Date(order.createdAt).toLocaleString("ko-KR"))); });
        if (!(value.orders || []).length) table.appendChild(el("li", {}, "주문이 없어요."));
      }).catch(function () { table.appendChild(el("li", {}, "주문 내역을 불러오지 못했어요.")); });
    }
  }
  document.addEventListener("DOMContentLoaded", function () {
    var page = document.body.getAttribute("data-page");
    var banner = document.getElementById("run");
    if (banner) banner.textContent = (run ? "실행 " + run : "") + (switches.length ? " · 스위치 " + switches.join(",") : "");
    fetch("catalog.json").then(function (response) { return response.json(); }).then(function (catalog) {
      if (on("slow")) { main().textContent = "불러오는 중…"; setTimeout(function () { render(page, catalog); }, 4000); } else render(page, catalog);
    }).catch(function () { main().textContent = "상품 정보를 불러오지 못했어요."; });
  });
})();
