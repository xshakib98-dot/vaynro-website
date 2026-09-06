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

let currentProduct = null;
let selectedSize = 'S';
let cart = [];

function selectSize(btn, size) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedSize = size;
}

db.collection("products").onSnapshot((snapshot) => {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.innerHTML = "";
  if(snapshot.empty) {
    grid.innerHTML = "<p style='text-align: center; width: 100%; color: #7d6e93;'>No products available.</p>";
    return;
  }
  snapshot.forEach((doc) => {
    const data = doc.data();
    grid.innerHTML += `
      <div class="card" onclick='openModal(${JSON.stringify(data)})'>
        <img src="${data.image}">
        <div class="card-details">
          <div class="card-title">${data.title}</div>
          <div class="card-price">${data.price} BDT</div>
        </div>
      </div>
    `;
  });
});

function openModal(product) {
  currentProduct = product;
  document.getElementById("modalImg").src = product.image;
  document.getElementById("modalTitle").innerText = product.title;
  
  document.getElementById("bkashDetailsBox").style.display = "none";
  document.getElementById("paymentMethod").value = "Cash on Delivery";
  document.getElementById("deliveryLocation").value = "inside_dhaka";
  
  calculateTotal();
  document.getElementById("productModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("productModal").style.display = "none";
}

// কার্ট পপআপ ওপেন করার ফাংশন
function openCartModal() {
  const container = document.getElementById("cartItemsContainer");
  container.innerHTML = "";
  
  if (cart.length === 0) {
    container.innerHTML = "<p style='text-align: center; color: #7d6e93; padding: 20px;'>Your cart is empty!</p>";
    document.getElementById("cartTotalPrice").innerText = "Total: 0 BDT";
  } else {
    let total = 0;
    cart.forEach((item, index) => {
      total += Number(item.price);
      container.innerHTML += `
        <div style="display: flex; align-items: center; justify-content: space-between; background: #f9f5fc; padding: 10px; border-radius: 10px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${item.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
            <div>
              <div style="font-size: 14px; font-weight: 600; color: #2d2342;">${item.title}</div>
              <div style="font-size: 12px; color: #7c5295;">Size: ${item.size} | ${item.price} BDT</div>
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
  document.getElementById("cartCount").innerText = cart.length;
  openCartModal(); // কার্ট রিফ্রেশ করা
}

function addToCart() {
  if(!currentProduct) {
    alert("Please select a product first!");
    return;
  }
  cart.push({ ...currentProduct, size: selectedSize });
  document.getElementById("cartCount").innerText = cart.length;
  alert(`Added ${currentProduct.title} (Size: ${selectedSize}) to Cart!`);
  closeModal();
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
  
  document.getElementById("modalPrice").innerText = `Price: ${currentProduct.price} + Delivery: ${deliveryFee} = Total: ${totalPrice} BDT`;
}

function placeOrder() {
  if(!currentProduct) {
    alert("No product selected!");
    return;
  }

  const name = document.getElementById("buyerName").value;
  const phone = document.getElementById("buyerPhone").value;
  const address = document.getElementById("buyerAddress").value;
  const payment = document.getElementById("paymentMethod").value;
  const location = document.getElementById("deliveryLocation").value;
  
  let bkashSender = "";
  let bkashTrxID = "";

  if(!name || !phone || !address) {
    alert("Please fill in your delivery details!");
    return;
  }

  if(payment === "bKash") {
    bkashSender = document.getElementById("bkashSenderPhone").value;
    bkashTrxID = document.getElementById("bkashTrxId").value;
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
