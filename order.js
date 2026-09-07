// ==========================================
// VAYNRO - E-Commerce Management (order.js)
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyAw6PTjumhTGMog6LAyCaFNuyIg2E16fd8",
  authDomain: "vaynro-website.firebaseapp.com",
  projectId: "vaynro-website",
  storageBucket: "vaynro-website.firebasestorage.app",
  messagingSenderId: "442609775562",
  appId: "1:442609775562:web:51722b9bd1c34b6cac9533",
  measurementId: "G-225DYYLGER"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global State Variables
let allProducts = [];
let currentProduct = null;
let selectedSize = 'S';
let cart = JSON.parse(localStorage.getItem('vaynro_cart')) || [];
let currentCategory = 'all';

function selectSize(btn, size) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedSize = size;
}

// Real-time listener from Firestore
db.collection("products").onSnapshot((snapshot) => {
  allProducts = [];
  snapshot.forEach((doc) => {
    allProducts.push({ id: doc.id, ...doc.data() });
  });
  filterProducts(); // ফিল্টার অনুযায়ী প্রোডাক্ট রেন্ডার হবে
});

// Category Filtering Function
function setCategory(category, btnElement) {
  currentCategory = category;
  
  // Active button styling update
  document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  filterProducts();
}

// Combined Search and Category Filter
function filterProducts() {
  const searchInputEl = document.getElementById('searchInput');
  const searchInput = searchInputEl ? searchInputEl.value.toLowerCase() : '';

  const filtered = allProducts.filter(product => {
    const productCat = (product.category || '').toLowerCase();
    const matchesCategory = (currentCategory === 'all') || (productCat.includes(currentCategory));

    const productTitle = (product.title || '').toLowerCase();
    const matchesSearch = productTitle.includes(searchInput);

    return matchesCategory && matchesSearch;
  });

  renderProductsGrid(filtered);
}

// Render Products to Grid
function renderProductsGrid(products) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if(products.length === 0) {
    grid.innerHTML = "<p style='text-align: center; width: 100%; color: var(--subtext-color);'>No products available.</p>";
    return;
  }

  products.forEach((product) => {
    grid.innerHTML += `
      <div class="card" onclick='openModal(${JSON.stringify(product)})'>
        <img src="${product.image}">
        <div class="card-details">
          <div class="card-title">${product.title}</div>
          <div class="card-price">${product.price} BDT</div>
        </div>
      </div>
    `;
  });
}

function openModal(product) {
  currentProduct = product;
  selectedSize = 'S';

  document.getElementById("modalImg").src = product.image;
  document.getElementById("modalTitle").innerText = product.title;
  
  // Reset size buttons to default 'S'
  const sizeBtns = document.querySelectorAll('.size-btn');
  sizeBtns.forEach((btn, index) => {
    if (index === 0) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  document.getElementById("bkashDetailsBox").style.display = "none";
  document.getElementById("paymentMethod").value = "Cash on Delivery";
  document.getElementById("deliveryLocation").value = "inside_dhaka";
  document.getElementById("buyerName").value = '';
  document.getElementById("buyerPhone").value = '';
  document.getElementById("buyerAddress").value = '';
  document.getElementById("bkashSenderPhone").value = '';
  document.getElementById("bkashTrxId").value = '';
  
  calculateTotal();

  // Load reviews for this product
  loadProductReviews(product.id);

  document.getElementById("productModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("productModal").style.display = "none";
}

// Cart Management Functions
window.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
});

function openCartModal() {
  const container = document.getElementById("cartItemsContainer");
  if (!container) return;
  container.innerHTML = "";
  
  if (cart.length === 0) {
    container.innerHTML = "<p style='text-align: center; color: var(--subtext-color); padding: 20px;'>Your cart is empty!</p>";
    document.getElementById("cartTotalPrice").innerText = "Total: 0 BDT";
  } else {
    let total = 0;
    cart.forEach((item, index) => {
      total += Number(item.price);
      container.innerHTML += `
        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-color); padding: 10px; border-radius: 10px; margin-bottom: 8px; border: 1px solid var(--card-border);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${item.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
            <div>
              <div style="font-size: 14px; font-weight: 600; color: var(--text-color);">${item.title}</div>
              <div style="font-size: 12px; color: var(--primary-color);">Size: ${item.size} | ${item.price} BDT</div>
            </div>
          </div>
          <button onclick="removeFromCart(${index})" style="background: none; border: none; color: #d81b60; font-size: 16px; cursor: pointer;">🗑️</button>
        </div>
      `;
    });
    document.getElementById("cartTotalPrice").innerText = `Total: ${total} BDT`;
  }
  
  document.getElementById("cartModal").style.display = "flex";
}

function closeCartModal() {
  document.getElementById("cartModal").style.display = "none";
}

function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem('vaynro_cart', JSON.stringify(cart));
  updateCartCount();
  openCartModal();
}

function addToCart() {
  if(!currentProduct) {
    alert("Please select a product first!");
    return;
  }
  cart.push({ ...currentProduct, size: selectedSize });
  localStorage.setItem('vaynro_cart', JSON.stringify(cart));
  updateCartCount();
  alert(`Added ${currentProduct.title} (Size: ${selectedSize}) to Cart!`);
  closeModal();
}

function updateCartCount() {
  const countEl = document.getElementById("cartCount");
  if (countEl) countEl.innerText = cart.length;
}

document.getElementById("paymentMethod")?.addEventListener("change", function() {
  const bkashBox = document.getElementById("bkashDetailsBox");
  if(this.value === "bKash") {
    bkashBox.style.display = "block";
  } else {
    bkashBox.style.display = "none";
  }
});

document.getElementById("deliveryLocation")?.addEventListener("change", function() {
  calculateTotal();
});

function calculateTotal() {
  if(!currentProduct) return;
  const location = document.getElementById("deliveryLocation").value;
  let deliveryFee = location === "inside_dhaka" ? 70 : 150;
  let totalPrice = Number(currentProduct.price) + deliveryFee;
  
  const modalPriceEl = document.getElementById("modalPrice");
  if(modalPriceEl) {
    modalPriceEl.innerText = `Price: ${currentProduct.price} + Delivery: ${deliveryFee} = Total: ${totalPrice} BDT`;
  }
}

function placeOrder() {
  if(!currentProduct) {
    alert("No product selected!");
    return;
  }

  const name = document.getElementById("buyerName").value.trim();
  const phone = document.getElementById("buyerPhone").value.trim();
  const address = document.getElementById("buyerAddress").value.trim();
  const payment = document.getElementById("paymentMethod").value;
  const location = document.getElementById("deliveryLocation").value;
  
  let bkashSender = "";
  let bkashTrxID = "";

  if(!name || !phone || !address) {
    alert("Please fill in your delivery details!");
    return;
  }

  if(payment === "bKash") {
    bkashSender = document.getElementById("bkashSenderPhone").value.trim();
    bkashTrxID = document.getElementById("bkashTrxId").value.trim();
    if(!bkashSender || !bkashTrxID) {
      alert("Please provide your bKash number and TrxID!");
      return;
    }
  }

  let deliveryFee = location === "inside_dhaka" ? 70 : 150;
  let finalTotalAmount = Number(currentProduct.price) + deliveryFee;
  let deliveryAreaText = location === "inside_dhaka" ? "Inside Dhaka (70 BDT)" : "Outside Dhaka (150 BDT)";

  db.collection("orders").add({
    productTitle: currentProduct.title,
    productPrice: Number(currentProduct.price),
    productImage: currentProduct.image,
    size: selectedSize,
    customerName: name,
    customerPhone: phone,
    customerAddress: address,
    deliveryArea: deliveryAreaText,
    deliveryCharge: deliveryFee,
    totalAmount: finalTotalAmount,
    paymentMethod: payment,
    bkashSenderNumber: bkashSender,
    bkashTrxID: bkashTrxID,
    orderDate: new Date().toLocaleString()
  })
  .then(() => {
    alert(`Order placed successfully via ${payment}!\nYour order has been saved.`);
    closeModal();
    document.getElementById("buyerName").value = '';
    document.getElementById("buyerPhone").value = '';
    document.getElementById("buyerAddress").value = '';
    if(payment === "bKash") {
      document.getElementById("bkashSenderPhone").value = '';
      document.getElementById("bkashTrxId").value = '';
    }
  })
  .catch((error) => {
    alert("Error placing order: " + error.message);
  });
}

// Product Reviews & Comments System
function loadProductReviews(productId) {
  const container = document.getElementById('reviewListContainer');
  if (!container) return;
  container.innerHTML = `<p style="font-size: 12px; color: var(--subtext-color);">Loading reviews...</p>`;

  db.collection("products").doc(productId).collection("reviews")
    .orderBy("date", "desc")
    .get()
    .then((querySnapshot) => {
      container.innerHTML = "";
      if (querySnapshot.empty) {
        container.innerHTML = `<p style="font-size: 12px; color: var(--subtext-color);">No reviews yet. Be the first to review!</p>`;
        return;
      }

      querySnapshot.forEach((doc) => {
        const rev = doc.data();
        const stars = "⭐".repeat(Number(rev.rating) || 5);
        
        const reviewEl = document.createElement('div');
        reviewEl.className = 'review-item';
        reviewEl.innerHTML = `
          <div class="review-author" style="display: flex; justify-content: space-between; font-weight: 700; color: var(--primary-hover); margin-bottom: 3px;">
            <span>${rev.author}</span>
            <span class="review-stars">${stars}</span>
          </div>
          <div style="color: var(--text-color);">${rev.comment}</div>
        `;
        container.appendChild(reviewEl);
      });
    })
    .catch((error) => {
      console.error("Error loading reviews: ", error);
      container.innerHTML = `<p style="font-size: 12px; color: var(--subtext-color);">Could not load reviews.</p>`;
    });
}

function submitProductReview() {
  if (!currentProduct) return;

  const author = document.getElementById('reviewAuthor').value.trim();
  const rating = document.getElementById('reviewRating').value;
  const comment = document.getElementById('reviewComment').value.trim();

  if (!author || !comment) {
    alert("Please enter your name and comment.");
    return;
  }

  const reviewData = {
    author: author,
    rating: rating,
    comment: comment,
    date: new Date().toISOString()
  };

  db.collection("products").doc(currentProduct.id).collection("reviews").add(reviewData)
    .then(() => {
      alert("Review posted successfully!");
      document.getElementById('reviewAuthor').value = '';
      document.getElementById('reviewComment').value = '';
      loadProductReviews(currentProduct.id);
    })
    .catch((error) => {
      console.error("Error adding review: ", error);
      alert("Failed to post review.");
    });
}
