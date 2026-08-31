// ==========================================
// 1. تهيئة Firebase والإعدادات الأساسية
// ==========================================
// ⚠️ استبدل هذه القيم ببيانات مشروعك الخاصة من Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// تشغيل Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// رقم الواتساب الافتراضي
let currentWhatsappNumber = "213656708603";

// قائمة المنتجات الافتراضية (Fallback)
let products = [
    { id: "1", name: "عطر الملكي الفاخر", price: 4500, desc: "مزيج ساحر من العود الملكي المعتّق والمسك الأبيض الأصيل.", img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400" },
    { id: "2", name: "سحر الشرق النادر", price: 5200, desc: "عطر شرقي دافئ يجمع بين أخشاب الصندل ونفحات التوابل النادرة.", img: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400" },
    { id: "3", name: "كريستال لور النسائي", price: 4800, desc: "إطلالة منعشة من الزهور البيضاء ولمسة من الفانيليا الساحرة.", img: "https://images.unsplash.com/photo-1588405748373-122b2321bc31?w=400" },
    { id: "4", name: "العود الأزرق النقي", price: 6000, desc: "رائحة بخورية فخمة تدوم لأكثر من 48 ساعة للمناسبات الكبرى.", img: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400" },
    { id: "5", name: "ليالي دمشق السرية", price: 3900, desc: "مزيج غامض ومثير من الورد الجوري والعنبر الأسود الفاخر.", img: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400" }
];

// استرجاع السلة من LocalStorage إن وجدت
let cart = JSON.parse(localStorage.getItem('luxury_perfumes_cart')) || [];

// ==========================================
// 2. جلب البيانات من Firebase عند التحميل
// ==========================================
async function initStore() {
    showLoader(true);

    // 1. جلب رقم الواتساب
    try {
        const configDoc = await db.collection("settings").doc("config").get();
        if (configDoc.exists && configDoc.data().whatsapp) {
            currentWhatsappNumber = configDoc.data().whatsapp.replace(/[^0-9]/g, ''); // تنظيف الرقم
        }
    } catch (e) {
        console.warn("استخدام رقم الواتساب الافتراضي:", e);
    }

    // 2. جلب المنتجات من Firestore
    try {
        const snapshot = await db.collection("products").get();
        if (!snapshot.empty) {
            const firebaseProducts = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                firebaseProducts.push({
                    id: doc.id,
                    name: data.name || "عطر فاخر",
                    price: Number(data.price) || 0,
                    desc: data.desc || "عطر فاخر من مجموعتنا الملكية.",
                    img: (data.images && data.images.length > 0) ? data.images[0] : "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400"
                });
            });
            products = firebaseProducts;
        }
    } catch (e) {
        console.warn("تعذر جلب المنتجات من Firebase، تم استخدام القائمة الافتراضية:", e);
    } finally {
        showLoader(false);
    }

    renderProducts();
    updateCartUI();
}

// عرض مؤشر التحميل (اختياري حسب تصميم واجهتك)
function showLoader(isLoading) {
    const loader = document.getElementById('loading-spinner');
    if (loader) {
        loader.style.display = isLoading ? 'block' : 'none';
    }
}

// ==========================================
// 3. عرض المنتجات في الصفحة
// ==========================================
function renderProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `<p class="no-products">لا توجد منتجات متاحة حالياً.</p>`;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card" data-id="${product.id}">
            <img src="${product.img}" class="product-image" alt="${product.name}" loading="lazy">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-desc">${product.desc}</p>
                <div class="product-price">${product.price.toLocaleString('ar-DZ')} د.ج</div>
                <button class="add-btn" onclick="addToCart('${product.id}')">إضافة إلى السلة</button>
            </div>
        </div>
    `).join('');
}

// ==========================================
// 4. إدارة السلة (إضافة - إزالة - تحديث)
// ==========================================

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

// إضافة منتج للسلة مع حساب الكمية
function addToCart(productId) {
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) return;

    const existingIndex = cart.findIndex(item => String(item.id) === String(productId));
    if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            qty: 1
        });
    }

    saveCart();
    updateCartUI();
}

// تغيير الكمية داخل السلة
function updateQuantity(index, change) {
    if (cart[index]) {
        cart[index].qty += change;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
        updateCartUI();
    }
}

// إزالة عنصر من السلة
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
}

// حفظ السلة محلياً
function saveCart() {
    localStorage.setItem('luxury_perfumes_cart', JSON.stringify(cart));
}

// تحديث واجهة السلة
function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) cartCountEl.innerText = totalCount;

    const cartList = document.getElementById('cart-items');
    if (!cartList) return;

    cartList.innerHTML = '';
    let totalAmount = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        totalAmount += itemTotal;

        const li = document.createElement('li');
        li.className = 'cart-item-ui';
        li.innerHTML = `
            <div class="cart-item-details">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">${item.price.toLocaleString('ar-DZ')} د.ج</span>
            </div>
            <div class="cart-item-actions">
                <button onclick="updateQuantity(${index}, -1)">-</button>
                <span>${item.qty}</span>
                <button onclick="updateQuantity(${index}, 1)">+</button>
                <button class="remove-item-btn" onclick="removeFromCart(${index})">&times;</button>
            </div>
        `;
        cartList.appendChild(li);
    });

    const cartTotalEl = document.getElementById('cart-total');
    if (cartTotalEl) cartTotalEl.innerText = totalAmount.toLocaleString('ar-DZ');
}

// ==========================================
// 5. حفظ الطلب في Firebase والتحويل للواتساب
// ==========================================
async function sendOrderToWhatsapp() {
    if (cart.length === 0) {
        alert('سلتك فارغة حالياً، تفضل باختيار عطورك الفخمة أولاً!');
        return;
    }

    const customerName = prompt("اسمك الكريم لتأكيد الطلب:") || "زبون المتجر";
    const customerPhone = prompt("يرجى إدخال رقم هاتفك:");

    if (!customerPhone || customerPhone.trim() === "") {
        alert("رقم الهاتف مطلوب لتأكيد الطلب!");
        return;
    }

    let grandTotal = 0;
    const itemsList = cart.map(item => {
        const itemTotal = item.price * item.qty;
        grandTotal += itemTotal;
        return {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.qty,
            subtotal: itemTotal
        };
    });

    // 1. تسجيل الطلب في Firebase
    try {
        await db.collection("orders").add({
            customerName: customerName.trim(),
            phone: customerPhone.trim(),
            items: itemsList,
            total: grandTotal,
            status: "pending", // حالة الطلب
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error("خطأ أثناء حفظ الطلب في قواعد البيانات:", e);
    }

    // 2. صياغة نص الرسالة للواتساب
    let message = "👑 *طلب جديد من متجر عطور الفخامة* 👑\n\n";
    message += `👤 *الزبون:* ${customerName.trim()}\n`;
    message += `📱 *الهاتف:* ${customerPhone.trim()}\n\n`;
    message += "*المنتجات المطلوبة:*\n";
    
    cart.forEach((item, idx) => {
        message += `${idx + 1}. *${item.name}*\n   الكمية: ${item.qty} | السعر: ${item.price * item.qty} د.ج\n`;
    });
    
    message += `\n💰 *الإجمالي الكلي:* ${grandTotal.toLocaleString('ar-DZ')} د.ج\n`;
    message += "-----------------------------\n";
    message += "يرجى تأكيد الطلب لتزويدكم بمعلومات الشحن والدفع.";

    // 3. مسح السلة بعد نجاح إعداد الطلب
    cart = [];
    saveCart();
    updateCartUI();
    toggleCart();

    // 4. فتح رابط الواتساب
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${currentWhatsappNumber}?text=${encodedMessage}`, '_blank');
}

// تشغيل التطبيق عند تحميل DOM
document.addEventListener('DOMContentLoaded', initStore);
