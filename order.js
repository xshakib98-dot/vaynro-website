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
  document.getElementById("modalPrice").innerText = product.price + " BDT";
  document.getElementById("productModal").style.display = "flex";
  
  // ডিফল트 হিসেবে বিকাশ ফিল্ড হাইড থাকবে এবং ডেলিভারি চার্জ রিসেট হবে
  document.getElementById("bkashDetailsBox").style.display = "none";
  calculateTotal();
}

function closeModal() {
  document.getElementById("productModal").style.display = "none";
}

function addToCart() {
  if(!currentProduct) return;
  cart.push({ ...currentProduct, size: selectedSize });
  document.getElementById("cartCount").innerText = cart.length;
  alert(`Added ${currentProduct.title} (Size: ${selectedSize}) to Cart!`);
  closeModal();
}

// পেমেন্ট মেথড বা লোকেশন পরিবর্তন হলে টোটাল অ্যামাউন্ট এবং বিকাশ বক্স হ্যান্ডেল করার ফাংশন
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
  
  // মোডাল প্রাইসের নিচে টোটাল অ্যামাউন্ট দেখানোর জন্য
  document.getElementById("modalPrice").innerText = `${currentProduct.price} BDT + Delivery: ${deliveryFee} BDT = Total: ${totalPrice} BDT`;
}

function placeOrder() {
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

  // যদি বিকাশ সিলেক্ট করা থাকে তবে নাম্বার ও ট্রানজ্যাকশন কোড চেক করা
  if(payment === "bKash") {
    bkashSender = document.getElementById("bkashSenderPhone").value;
    bkashTrxID = document.getElementById("bkashTrxId").value;
    if(!bkashSender || !bkashTrxID) {
      alert("Please provide your bKash number and TrxID for verification!");
      return;
    }
  }

  let deliveryFee = location === "inside_dhaka" ? 70 : 150;
  let finalTotalAmount = Number(currentProduct.price) + deliveryFee;
  let deliveryAreaText = location === "inside_dhaka" ? "Inside Dhaka (70 BDT)" : "Outside Dhaka (150 BDT)";

  // ফায়ারবেসের 'orders' কালেকশনে সম্পূর্ণ তথ্য পাঠানো হচ্ছে
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
    alert(`Order placed successfully via ${payment}!\nYour order has been saved to Firebase.`);
    closeModal();
    // ফর্ম ক্লিয়ার করা
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
