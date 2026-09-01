// إعدادات Firebase الخاصة بمشروعك (محدثة برابط Realtime Database)
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
let whatsappNumber = "213656708603"; // رقم الواتساب الافتراضي

// 1. جلب المنتجات ورقم الواتساب تلقائياً من Realtime Database
function fetchProducts() {
    const container = document.getElementById('products-container');
    if (container) {
        container.innerHTML = '<p style="text-align:center; grid-column:1/-1; color:#94a3b8; padding:40px;">جاري تحميل العطور...</p>';
    }
    
    // جلب رقم الواتساب من الإعدادات
    db.ref("settings/config/whatsapp").on('value', snap => {
        if (snap.exists() && snap.val()) {
            whatsappNumber = snap.val();
        }
    });

    // الاستماع المباشر للتغيرات في المنتجات
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

// 2. عرض المنتجات في الصفحة
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

// 3. تصفية التصنيفات
function filterCategory(cat, btn) {
    targetCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderProducts();
}

// 4. إدارة السلة والكميات
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
    
    // فتح السلة تلقائياً عند إضافة منتج
    const drawer = document.getElementById('cart-drawer');
    if (drawer) {
        drawer.classList.add('active');
        drawer.classList.add('open');
    }
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

// 5. تحديث واجهة السلة
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

// 6. فتح وإغلاق السلة
function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) {
        drawer.classList.toggle('active');
        drawer.classList.toggle('open');
    }
}

// 7. إرسال الطلب عبر واتساب وتسجيله في قاعدة البيانات
async function sendOrderWhatsApp() {
    if (cart.length === 0) { 
        alert("السلة فارغة!"); 
        return; 
    }

    let total = 0;
    let text = "مرحباً، أريد تأكيد طلب العطور التالية من المتجر:\n\n";
    
    cart.forEach(i => {
        const itemTotal = i.price * i.qty;
        total += itemTotal;
        text += `- ${i.name} (الكمية: ${i.qty}) -> بسعر: ${itemTotal} د.ج\n`;
    });
    
    text += `\n💰 الإجمالي: ${total} د.ج`;

    // تسجيل الطلب في Firebase Realtime Database
    try {
        await db.ref("orders").push({
            items: cart,
            total: total,
            createdAt: Date.now()
        });
    } catch (e) {
        console.error("Error saving order:", e);
    }

    // فتح رابط الواتساب
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
}

// بدء التشغيل
fetchProducts();
