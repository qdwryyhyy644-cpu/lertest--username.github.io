// قاعدة بيانات المنتجات الخمسة
const products = [
    { id: 1, name: "عطر الملكي الفاخر", price: 4500, desc: "مزيج ساحر من العود الملكي المعتّق والمسك الأبيض الأصيل.", img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400" },
    { id: 2, name: "سحر الشرق النادر", price: 5200, desc: "عطر شرقي دافئ يجمع بين أخشاب الصندل ونفحات التوابل النادرة.", img: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400" },
    { id: 3, name: "كريستال لور النسائي", price: 4800, desc: "إطلالة منعشة من الزهور البيضاء ولمسة من الفانيليا الساحرة.", img: "https://images.unsplash.com/photo-1588405748373-122b2321bc31?w=400" },
    { id: 4, name: "العود الأزرق النقي", price: 6000, desc: "رائحة بخورية فخمة تدوم لأكثر من 48 ساعة للمناسبات الكبرى.", img: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400" },
    { id: 5, name: "ليالي دمشق السرية", price: 3900, desc: "مزيج غامض ومثير من الورد الجوري والعنبر الأسود الفاخر.", img: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400" }
];

let cart = [];

// عرض المنتجات في الصفحة عند تحميلها
function renderProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.img}" class="product-image" alt="${product.name}">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-desc">${product.desc}</p>
                <div class="product-price">${product.price} د.ج</div>
                <button class="add-btn" onclick="addToCart(${product.id})">إضافة إلى السلة</button>
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
    const product = products.find(p => p.id === productId);
    cart.push(product);
    updateCartUI();
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

// إرسال الطلب بشكل احترافي للواتساب
function sendOrderToWhatsapp() {
    if (cart.length === 0) {
        alert('سلتك فارغة حالياً، تفضل باختيار عطورك الفخمة أولاً!');
        return;
    }
    
    let message = "👑 *طلب جديد من متجر عطور الفخامة* 👑\n\n";
    message += "أود طلب المنتجات التالية:\n";
    let total = 0;
    
    cart.forEach((item, idx) => {
        message += `${idx + 1}. *${item.name}* (${item.price} د.ج)\n`;
        total += item.price;
    });
    
    message += `\n💰 *الحساب الإجمالي:* ${total} د.ج\n`;
    message += "-----------------------------\n";
    message += "يرجى تأكيد الطلب لتزويدكم بمعلومات الشحن والدفع.";
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/213656708603?text=${encodedMessage}`, '_blank');
}

// تشغيل الدالة عند فتح الصفحة
window.onload = renderProducts;

