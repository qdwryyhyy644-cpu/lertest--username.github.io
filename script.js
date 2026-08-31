// ==========================================
// تهيئة Firebase للمتجر الرئيسي
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

// رقم الواتساب الافتراضي في حال عدم وجود رقم في اللوحة
let currentWhatsappNumber = "213656708603";

// قائمة المنتجات الافتراضية (تُستخدم كاحتياطي)
let products = [
    { id: "1", name: "عطر الملكي الفاخر", price: 4500, desc: "مزيج ساحر من العود الملكي المعتّق والمسك الأبيض الأصيل.", img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400" },
    { id: "2", name: "سحر الشرق النادر", price: 5200, desc: "عطر شرقي دافئ يجمع بين أخشاب الصندل ونفحات التوابل النادرة.", img: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400" },
    { id: "3", name: "كريستال لور النسائي", price: 4800, desc: "إطلالة منعشة من الزهور البيضاء ولمسة من الفانيليا الساحرة.", img: "https://images.unsplash.com/photo-1588405748373-122b2321bc31?w=400" },
    { id: "4", name: "العود الأزرق النقي", price: 6000, desc: "رائحة بخورية فخمة تدوم لأكثر من 48 ساعة للمناسبات الكبرى.", img: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400" },
    { id: "5", name: "ليالي دمشق السرية", price: 3900, desc: "مزيج غامض ومثير من الورد الجوري والعنبر الأسود الفاخر.", img: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400" }
];

let cart = [];

// ==========================================
// جلب البيانات من Firebase عند التحميل
// ==========================================
async function initStore() {
    // 1. جلب رقم الواتساب المحدث من لوحة التحكم
    try {
        const configDoc = await db.collection("settings").doc("config").get();
        if (configDoc.exists && configDoc.data().whatsapp) {
            currentWhatsappNumber = configDoc.data().whatsapp;
        }
    } catch (e) {
        console.log("استخدام رقم الواتساب الافتراضي:", e);
    }

    // 2. جلب المنتجات المضافة من لوحة التحكم
    try {
        const snapshot = await db.collection("products").get();
        if (!snapshot.empty) {
            const firebaseProducts = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                firebaseProducts.push({
                    id: doc.id,
                    name: data.name,
                    price: Number(data.price),
                    desc: data.desc || "عطر فاخر من مجموعتنا الملكية.",
                    // استخدام أول صورة تم رفعها من لوحة التحكم
                    img: (data.images && data.images.length > 0) ? data.images[0] : "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400"
                });
            });
            products = firebaseProducts; // استبدال المنتجات بالمنتجات الحقيقية من اللوحة
        }
    } catch (e) {
        console.log("تعذر جلب المنتجات من Firebase، استخدام المنتجات الافتراضية:", e);
    }

    renderProducts();
}

// عرض المنتجات في الصفحة
function renderProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;

    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.img}" class="product-image" alt="${product.name}">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-desc">${product.desc}</p>
                <div class="product-price">${product.price} د.ج</div>
                <button class="add-btn" onclick="addToCart('${product.id}')">إضافة إلى السلة</button>
            </div>
        </div>
    `).join('');
}

// فتح وإغلاق السلة الجانبية
function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('active');
}

// إضافة منتج للسلة
function addToCart(productId) {
    const product = products.find(p => String(p.id) === String(productId));
    if (product) {
        cart.push(product);
        updateCartUI();
    }
}

// إزالة منتج من السلة
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// تحديث واجهة السلة والعدادات
function updateCartUI() {
    document.getElementById('cart-count').innerText = cart.length;
    const cartList = document.getElementById('cart-items');
    cartList.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;
        const li = document.createElement('li');
        li.className = 'cart-item-ui';
        li.innerHTML = `
            <span>${item.name}</span>
            <span>${item.price} د.ج <button class="remove-item-btn" onclick="removeFromCart(${index})">&times;</button></span>
        `;
        cartList.appendChild(li);
    });

    document.getElementById('cart-total').innerText = total;
}

// ==========================================
// إرسال الطلب وحفظه في Firebase + التحويل للواتساب
// ==========================================
async function sendOrderToWhatsapp() {
    if (cart.length === 0) {
        alert('سلتك فارغة حالياً، تفضل باختيار عطورك الفخمة أولاً!');
        return;
    }

    // طلب رقم الهاتف من الزبون للوحة التحكم
    const customerPhone = prompt("يرجى إدخال رقم هاتفك لتأكيد الطلب:");
    if (!customerPhone) {
        alert("رقم الهاتف مطلوب لتأكيد الطلب!");
        return;
    }

    const customerName = prompt("اسمك الكريم (اختياري):") || "زبون المتجر";

    let total = 0;
    const itemsList = cart.map(item => {
        total += item.price;
        return { name: item.name, price: item.price };
    });

    // 1. تسجيل الطلب تلقائياً في Firebase لوحة التحكم
    try {
        await db.collection("orders").add({
            customerName: customerName,
            phone: customerPhone,
            items: itemsList,
            total: total,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error("خطأ في حفظ الطلب في اللوحة:", e);
    }

    // 2. إعداد رسالة الواتساب
    let message = "👑 *طلب جديد من متجر عطور الفخامة* 👑\n\n";
    message += `👤 *الزبون:* ${customerName}\n`;
    message += `📱 *الهاتف:* ${customerPhone}\n\n`;
    message += "أود طلب المنتجات التالية:\n";
    
    cart.forEach((item, idx) => {
        message += `${idx + 1}. *${item.name}* (${item.price} د.ج)\n`;
    });
    
    message += `\n💰 *الحساب الإجمالي:* ${total} د.ج\n`;
    message += "-----------------------------\n";
    message += "يرجى تأكيد الطلب لتزويدكم بمعلومات الشحن والدفع.";
    
    // 3. التحويل للواتساب عبر الرقم الديناميكي المجلوب من اللوحة
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${currentWhatsappNumber}?text=${encodedMessage}`, '_blank');
}

// تشغيل جلب البيانات والميزات عند فتح الصفحة
window.onload = initStore;
