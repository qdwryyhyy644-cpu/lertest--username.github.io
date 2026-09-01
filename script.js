const firebaseConfig = {
  apiKey: "AIzaSyC3Y1n6gd-XtJdv-7UKOesb9-Lgc2lII0c",
  authDomain: "otour-elfakhama-cf76d.firebaseapp.com",
  projectId: "otour-elfakhama-cf76d",
  storageBucket: "otour-elfakhama-cf76d.firebasestorage.app",
  messagingSenderId: "843441752510",
  appId: "1:843441752510:web:94b201def5ea9510c491ef",
  databaseURL: "https://otour-elfakhama-cf76d-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let allProducts = [];
let cart = [];
let targetCategory = 'الكل';
let whatsappNumber = "213656708603";

function fetchProducts() {
    const container = document.getElementById('products-container');
    if (container) {
        container.innerHTML = '<p style="text-align:center; grid-column:1/-1; color:#94a3b8; padding:40px;">جاري تحميل العطور...</p>';
    }
    
    db.ref("settings/config/whatsapp").on('value', snap => {
        if (snap.exists() && snap.val()) whatsappNumber = snap.val();
    });

    db.ref("products").on('value', snapshot => {
        allProducts = [];
        if (snapshot.exists()) {
            snapshot.forEach(doc => {
                allProducts.push({ id: doc.key, ...doc.val() });
            });
        }
        renderProducts();
    });
}

function renderProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;
    container.innerHTML = '';

    const filtered = targetCategory === 'الكل' 
        ? allProducts 
        : allProducts.filter(p => p.category === targetCategory);

    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; grid-column:1/-1; color:#888; padding:40px;">لا توجد عطور في هذا التصنيف حالياً.</p>';
        return;
    }

    filtered.forEach(p => {
        const images = (p.images && p.images.length > 0) ? p.images : ['https://via.placeholder.com/300'];
        let imgsHTML = images.slice(0, 3).map(img => `<img src="${img}" alt="${p.name}">`).join('');

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="slider-container">
                <div class="slider-images">${imgsHTML}</div>
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
    if (btn) btn.classList.add('active');
    renderProducts();
}

function addToCart(id) {
    const prod = allProducts.find(p => p.id === id);
    if (!prod) return;

    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty++;
    } else {
        cart.push({ ...prod, qty: 1 });
    }
    
    updateCartUI();
    toggleCart(true);
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    updateCartUI();
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    updateCartUI();
}

function updateCartUI() {
    const list = document.getElementById('cart-items-list');
    if (!list) return;
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
                <div class="gold-text">${item.price} د.ج × ${item.qty}</div>
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

    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-count');
    if (totalEl) totalEl.innerText = total + ' د.ج';
    if (countEl) countEl.innerText = count;
}

function toggleCart(forceOpen = false) {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) {
        if (forceOpen) {
            drawer.classList.add('active', 'open');
        } else {
            drawer.classList.toggle('active');
            drawer.classList.toggle('open');
        }
    }
}

function openCheckoutModal() {
    if (cart.length === 0) {
        alert("السلة فارغة!");
        return;
    }
    document.getElementById('checkout-modal').style.display = 'flex';
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').style.display = 'none';
}

async function submitOrder(e) {
    e.preventDefault();
    
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const state = document.getElementById('cust-state').value;
    const address = document.getElementById('cust-address').value;

    let total = 0;
    let orderDetails = [];
    let text = `📦 طلب جديد من: ${name}\n`;
    text += `📞 الهاتف: ${phone}\n`;
    text += `📍 الولاية: ${state}\n`;
    text += `🏠 العنوان: ${address}\n\n`;
    text += `🛒 الطلبيات:\n`;

    cart.forEach(i => {
        const itemTotal = i.price * i.qty;
        total += itemTotal;
        text += `- ${i.name} (${i.qty}) -> ${itemTotal} د.ج\n`;
        orderDetails.push({ name: i.name, qty: i.qty, price: i.price });
    });

    text += `\n💰 الإجمالي: ${total} د.ج`;

    // حفظ الطلب بالتفصيل في Firebase Realtime Database
    try {
        await db.ref("orders").push({
            customerName: name,
            phone: phone,
            state: state,
            address: address,
            items: orderDetails,
            total: total,
            createdAt: Date.now()
        });
    } catch (err) {
        console.error("Error saving order:", err);
    }

    // إخلاق النافذة والسلة وتصفير القائمة
    closeCheckoutModal();
    toggleCart(false);
    cart = [];
    updateCartUI();

    // إظهار شعار التنبيه
    const toast = document.getElementById('success-toast');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 4000);

    // توجيه للواتساب
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
}

fetchProducts();
