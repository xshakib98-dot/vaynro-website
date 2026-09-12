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
  filterProducts(); // ফিল্টার অনুযায়ী প্রোডাক্ট রেন্ডার হবে
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

// Render Products to Grid with Stock Out Badge Support
function renderProductsGrid(products) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if(products.length === 0) {
    grid.innerHTML = "<p style='text-align: center; width: 100%; color: var(--subtext-color);'>No products available.</p>";
    return;
  }

  products.forEach((product) => {
    const inStock = product.inStock !== false; // স্টক আউট কিনা চেক করা
    
    grid.innerHTML += `
      <div class="card" onclick='openModal(${JSON.stringify(product)})'>
        ${!inStock ? '<div class="stock-badge">Stock Out</div>' : ''}
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

  // Set main image
  document.getElementById("modalImg").src = product.image || (product.images && product.images[0]) || '';
  document.getElementById("modalTitle").innerText = product.title;
  
  // Render Multiple Images Gallery inside Modal
  let galleryContainer = document.getElementById("modalGalleryThumbnails");
  const modalContent = document.querySelector(".modal-content");
  
  if (!galleryContainer && modalContent) {
    galleryContainer = document.createElement("div");
    galleryContainer.id = "modalGalleryThumbnails";
    galleryContainer.style.cssText = "display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; padding-bottom: 5px;";
    const modalImgEl = document.getElementById("modalImg");
    if (modalImgEl) {
      modalImgEl.parentNode.insertBefore(galleryContainer, modalImgEl.nextSibling);
    }
  }

  if (galleryContainer) {
    galleryContainer.innerHTML = "";
    const imgs = product.images && product.images.length > 0 ? product.images : [product.image];
    
    if (imgs.length > 1) {
      galleryContainer.style.display = "flex";
      imgs.forEach((imgUrl) => {
        galleryContainer.innerHTML += `
          <div onclick="document.getElementById('modalImg').src='${imgUrl}'" style="width: 50px; height: 50px; border-radius: 6px; overflow: hidden; border: 1px solid var(--card-border); cursor: pointer; flex-shrink: 0;">
            <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        `;
      });
    } else {
      galleryContainer.style.display = "none";
    }
  }

  // Reset size buttons to default 'S'
  const sizeBtns = document.querySelectorAll('.size-btn');
  sizeBtns.forEach((btn, index) => {
    if (index === 0) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  // Stock Out চেক করে মোডাল ফর্ম হ্যান্ডেল করা
  const inStock = product.inStock !== false;
  let warningBox = document.getElementById("stockOutWarning");
  const orderFormContainer = document.getElementById("orderFormContainer");

  // যদি ইনডেক্স ফাইলে স্টক আউট ওয়ার্নিং বক্স না থাকে, তবে ডাইনামিক তৈরি করে নেব
  if (!warningBox) {
    warningBox = document.createElement("div");
    warningBox.id = "stockOutWarning";
    warningBox.style.cssText = "display: none; background: #ffebee; color: #c62828; padding: 12px; border-radius: 8px; font-weight: 700; text-align: center; margin-bottom: 15px; border: 1px solid #ef9a9a;";
    warningBox.innerText = "⚠️ This product is currently STOCK OUT! Order is unavailable.";
    const modalPriceEl = document.getElementById("modalPrice");
    if (modalContent && modalPriceEl) {
      modalContent.insertBefore(warningBox, modalPriceEl.nextSibling);
    }
  }

  if (!inStock) {
    warningBox.style.display = "block";
    if (orderFormContainer) orderFormContainer.style.display = "none";
  } else {
    warningBox.style.display = "none";
    if (orderFormContainer) orderFormContainer.style.display = "block";
  }

  const bkashBox = document.getElementById("bkashDetailsBox");
  if (bkashBox) bkashBox.style.display = "none";
  
  if (document.getElementById("paymentMethod")) document.getElementById("paymentMethod").value = "Cash on Delivery";
  if (document.getElementById("deliveryLocation")) document.getElementById("deliveryLocation").value = "inside_dhaka";
  if (document.getElementById("buyerName")) document.getElementById("buyerName").value = '';
  if (document.getElementById("buyerPhone")) document.getElementById("buyerPhone").value = '';
  if (document.getElementById("buyerAddress")) document.getElementById("buyerAddress").value = '';
  if (document.getElementById("bkashSenderPhone")) document.getElementById("bkashSenderPhone").value = '';
  if (document.getElementById("bkashTrxId")) document.getElementById("bkashTrxId").value = '';
  
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
  // স্টক আউট প্রোডাক্ট কার্টে অ্যাড করা থেকে বিরত রাখা
  if(currentProduct.inStock === false) {
    alert("This product is currently out of stock and cannot be added to cart.");
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
    if (bkashBox) bkashBox.style.display = "block";
  } else {
    if (bkashBox) bkashBox.style.display = "none";
  }
});

document.getElementById("deliveryLocation")?.addEventListener("change", function() {
  calculateTotal();
});

function calculateTotal() {
  if(!currentProduct) return;
  const locationEl = document.getElementById("deliveryLocation");
  const location = locationEl ? locationEl.value : "inside_dhaka";
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

  if(currentProduct.inStock === false) {
    alert("Sorry, this product is out of stock.");
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
