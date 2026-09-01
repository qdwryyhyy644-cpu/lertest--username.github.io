// ⚠️ ضع إعدادات Firebase الخاصة بك
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let allProducts = [];
let cart = [];
let targetCategory = 'الكل';

// جلب المنتجات الحقيقية فقط بدون أي منتجات وهمية
async function fetchProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '<p style="text-align:center; grid-column:1/-1;">جاري تحميل العطور...</p>';
    
    db.collection("products").onSnapshot(snapshot => {
        allProducts = [];
        snapshot.forEach(doc => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });
        renderProducts();
    });
}

function renderProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '';

    const filtered = targetCategory === 'الكل' 
        ? allProducts 
        : allProducts.filter(p => p.category === targetCategory);

    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; grid-column:1/-1; color:#888;">لا توجد عطور في هذا التصنيف حالياً.</p>';
        return;
    }

    filtered.forEach(p => {
        const images = (p.images && p.images.length > 0) ? p.images : ['https://via.placeholder.com/300'];
        let imgsHTML = images.slice(0, 3).map(img => `<img src="${img}" alt="${p.name}">`).join('');

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="slider-container">
                <div class="slider-images">
                    ${imgsHTML}
                </div>
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <p style="font-size:0.85rem; color:#aaa; margin-top:5px;">${p.desc || ''}</p>
                <div class="product-price">${p.price} د.ج</div>
                <button class="add-btn" onclick="addToCart('${p.id}')">إضافة للسلة</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function filterCategory(cat, btn) {
    targetCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts();
}

/* إدارة السلة والكميات */
function addToCart(id) {
    const prod = allProducts.find(p => p.id === id);
    const item = cart.find(i => i.id === id);

    if (item) {
        item.qty++;
    } else {
        cart.push({ ...prod, qty: 1 });
    }
    updateCartUI();
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    updateCartUI();
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    updateCartUI();
}

function updateCartUI() {
    const list = document.getElementById('cart-items-list');
    list.innerHTML = '';
    let total = 0;
    let count = 0;

    cart.forEach(item => {
        total += item.price * item.qty;
        count += item.qty;

        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
            <div>
                <div style="font-weight:bold;">${item.name}</div>
                <div class="gold-text">${item.price} د.ج</div>
            </div>
            <div style="display:flex; align-items:center; gap:5px;">
                <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
                <span style="padding:0 5px;">${item.qty}</span>
                <button class="qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
                <button class="remove-btn" onclick="removeFromCart('${item.id}')">×</button>
            </div>
        `;
        list.appendChild(el);
    });

    document.getElementById('cart-total').innerText = total + ' د.ج';
    document.getElementById('cart-count').innerText = count;
}

function toggleCart() {
    document.getElementById('cart-drawer').classList.toggle('open');
}

async function sendOrderWhatsApp() {
    if (cart.length === 0) { alert("السلة فارغة!"); return; }

    const configDoc = await db.collection("settings").doc("config").get();
    const phone = configDoc.exists ? configDoc.data().whatsapp : "";

    let text = "طلب جديد من المتجر:\n";
    cart.forEach(i => text += `- ${i.name} (الكمية: ${i.qty}) بسعر: ${i.price * i.qty} د.ج\n`);
    text += `الإجمالي: ${document.getElementById('cart-total').innerText}`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
}

fetchProducts();
