// --- GLOBAL CONFIGURATIONS ---
const CONFIG = {
    // === KONFIGURASI FIREBASE (ONLINE DATABASE) ===
    // Isi objek di bawah ini dengan konfigurasi dari Firebase Console Anda (Project Settings -> Web App).
    // Jika apiKey dikosongkan (""), aplikasi otomatis berjalan 100% Offline menggunakan LocalStorage browser.
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyDc6dKeK07nmylIv5eYbCBHsFziIENJl1k",
        authDomain: "dkmsa-4bfae.firebaseapp.com",
        databaseURL: "https://dkmsa-4bfae-default-rtdb.asia-southeast1.firebasedatabase.app", // URL Realtime Database (e.g., https://dkm-masjid-default-rtdb.firebaseio.com)
        projectId: "dkmsa-4bfae",
        storageBucket: "dkmsa-4bfae.firebasestorage.app",
        messagingSenderId: "236798785538",
        appId: "1:236798785538:web:1e2618df8f8bb7edb20f1b"
    },
    
    // === KATA SANDI / PASSWORD ADMIN ===
    // Digunakan oleh bendahara untuk masuk ke mode admin agar bisa menambah/mengubah data keuangan.
    ADMIN_PASSWORD: "assyaamisii"
};

// --- DEFAULT SYSTEM VALUES ---
const DEFAULT_CATEGORIES = [
    { name: "Kas Operasional Umum", type: "utama" },
    { name: "Kas Pembangunan Masjid", type: "utama" },
    { name: "Kas Anak Yatim", type: "khusus" },
    { name: "Kas Sosial & Kematian", type: "khusus" },
    { name: "Kas Zakat, Infaq, Shodaqoh", type: "khusus" },
    { name: "Kas PHBI (Hari Besar)", type: "khusus" },
    { name: "Kas Dana Haji/Umroh", type: "khusus" }
];

const DEFAULT_SETTINGS = {
    masjidName: "Masjid Al-Falah",
    address: "",
    city: "Bekasi",
    phone: "",
    email: "",
    website: "",
    titleKetua: "Ketua DKM Masjid",
    nameKetua: "H. Ahmad Fauzi, M.Ag.",
    titleBendahara: "Bendahara DKM",
    nameBendahara: "H. Mulyadi, S.E.",
    logo: "",
    stamp: "",
    signKetua: "",
    signBendahara: ""
};

const DEFAULT_TRANSACTIONS = [
    { id: "tx-1", date: "2026-07-03", category: "Kas Operasional Umum", desc: "Kotak Amal Jumat Minggu I", type: "pemasukan", amount: 3500000, image: null },
    { id: "tx-2", date: "2026-07-04", category: "Kas Anak Yatim", desc: "Infaq Khusus Anak Yatim dari H. Syarif", type: "pemasukan", amount: 1200000, image: null },
    { id: "tx-3", date: "2026-07-07", category: "Kas Pembangunan Masjid", desc: "Pembelian Sajadah & Karpet Masjid Baru", type: "pengeluaran", amount: 1800000, image: null },
    { id: "tx-4", date: "2026-07-10", category: "Kas Operasional Umum", desc: "Biaya Listrik & Air Bulanan Masjid", type: "pengeluaran", amount: 650000, image: null },
    { id: "tx-5", date: "2026-07-12", category: "Kas Sosial & Kematian", desc: "Santunan Uang Duka Warga Meninggal", type: "pengeluaran", amount: 500000, image: null },
    { id: "tx-6", date: "2026-07-15", category: "Kas Zakat, Infaq, Shodaqoh", desc: "Penerimaan Zakat Mal Kel. Bpk Sumardi", type: "pemasukan", amount: 2500000, image: null },
    { id: "tx-7", date: "2026-07-18", category: "Kas PHBI (Hari Besar)", desc: "Infaq Kegiatan Tahun Baru Hijriah", type: "pemasukan", amount: 1500000, image: null }
];

// --- APP GLOBAL STATE ---
let transactions = [];
let categories = [];
let settings = {};
let isAdmin = false;

// Multi-Tab Navigation State
let currentKasTab = "utama"; // 'utama' atau 'khusus'
let activeKhususCategory = null; // Menyimpan nama kategori kas khusus yang sedang dibuka (e.g., 'Kas Anak Yatim'), null jika di menu grid

// Upload Image State
let tempSelectedImageBase64 = null; // Menyimpan Base64 gambar struk sementara saat input form
let tempLogoBase64 = null;          // Menyimpan Base64 logo DKM sementara
let tempStampBase64 = null;         // Menyimpan Base64 stempel DKM sementara
let tempSignKetuaBase64 = null;     // Menyimpan Base64 tanda tangan ketua sementara
let tempSignBendaharaBase64 = null; // Menyimpan Base64 tanda tangan bendahara sementara
let activeDetailTxId = null; // ID transaksi yang sedang dibuka detail modallnya

// Database Connection Info
let isOnlineMode = false;
let firebaseDatabase = null;

// Visual Chart Instances (to prevent overlap)
let monthlyChartInstanceUtama = null;
let categoryChartInstanceUtama = null;

// Pagination States
const itemsPerPage = 10;
let currentPageUtama = 1;
let currentPageKhusus = 1;

let filteredTransactionsGlobalUtama = [];
let filteredTransactionsGlobalKhusus = [];

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Check Admin Session (SessionStorage so it resets when browser tab is closed)
    isAdmin = sessionStorage.getItem("dkm_is_admin") === "true";

    // 2. Setup Database Connection Mode
    initializeFirebaseConnection();

    // 3. Load All Data (Async if online)
    await loadData();

    // 4. Paint Page Components
    initializeUI();
    
    // 5. Trigger Initial Filter Load
    applyFilters();

    // 6. Setup Image Upload Listener
    setupImageUploadListener();
    setupSettingsImageUploadListeners();

    initIcons();
});

// --- CUSTOM ALERT TOAST SYSTEM ---
window.showAlert = function(message, type = "success") {
    const container = document.getElementById("alertContainer");
    if (!container) return;

    let alertClass = "alert-success bg-emerald-600 text-white";
    let iconName = "check-circle";
    if (type === "error") {
        alertClass = "alert-error text-white bg-red-600";
        iconName = "alert-triangle";
    } else if (type === "info") {
        alertClass = "alert-info text-white bg-blue-600";
        iconName = "info";
    } else if (type === "warning") {
        alertClass = "alert-warning text-slate-800 bg-amber-500";
        iconName = "alert-circle";
    }

    const alertDiv = document.createElement("div");
    alertDiv.className = `alert ${alertClass} shadow-lg flex items-center gap-2 rounded-xl py-3 px-4 transition-all duration-300 transform translate-y-2 opacity-0`;
    alertDiv.innerHTML = `
        <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0"></i>
        <span class="text-xs font-semibold">${message}</span>
    `;

    container.appendChild(alertDiv);
    
    if (window.lucide) {
        lucide.createIcons();
    }

    setTimeout(() => {
        alertDiv.classList.remove("translate-y-2", "opacity-0");
    }, 10);

    setTimeout(() => {
        alertDiv.classList.add("translate-y-2", "opacity-0");
        setTimeout(() => {
            alertDiv.remove();
        }, 300);
    }, 3000);
};

// --- SETTINGS IMAGE UPLOAD LOGIC ---
function setupSettingsImageUploadListeners() {
    const logoInput = document.getElementById("cfgLogoInput");
    if (logoInput) {
        logoInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 1.5 * 1024 * 1024) {
                    showAlert("Ukuran logo terlalu besar! Maksimal 1.5 MB.", "error");
                    logoInput.value = "";
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(evt) {
                    tempLogoBase64 = evt.target.result;
                    document.getElementById("cfgLogoPreview").src = tempLogoBase64;
                    document.getElementById("cfgLogoPreviewContainer").classList.remove("hidden");
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const stampInput = document.getElementById("cfgStampInput");
    if (stampInput) {
        stampInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 1.5 * 1024 * 1024) {
                    showAlert("Ukuran stempel terlalu besar! Maksimal 1.5 MB.", "error");
                    stampInput.value = "";
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(evt) {
                    tempStampBase64 = evt.target.result;
                    document.getElementById("cfgStampPreview").src = tempStampBase64;
                    document.getElementById("cfgStampPreviewContainer").classList.remove("hidden");
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const signKetuaInput = document.getElementById("cfgSignKetuaInput");
    if (signKetuaInput) {
        signKetuaInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 1.5 * 1024 * 1024) {
                    showAlert("Ukuran tanda tangan terlalu besar! Maksimal 1.5 MB.", "error");
                    signKetuaInput.value = "";
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(evt) {
                    tempSignKetuaBase64 = evt.target.result;
                    document.getElementById("cfgSignKetuaPreview").src = tempSignKetuaBase64;
                    document.getElementById("cfgSignKetuaPreviewContainer").classList.remove("hidden");
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const signBendaharaInput = document.getElementById("cfgSignBendaharaInput");
    if (signBendaharaInput) {
        signBendaharaInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 1.5 * 1024 * 1024) {
                    showAlert("Ukuran tanda tangan terlalu besar! Maksimal 1.5 MB.", "error");
                    signBendaharaInput.value = "";
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(evt) {
                    tempSignBendaharaBase64 = evt.target.result;
                    document.getElementById("cfgSignBendaharaPreview").src = tempSignBendaharaBase64;
                    document.getElementById("cfgSignBendaharaPreviewContainer").classList.remove("hidden");
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

window.clearCfgLogoSelection = function() {
    tempLogoBase64 = "";
    document.getElementById("cfgLogoInput").value = "";
    document.getElementById("cfgLogoPreview").src = "";
    document.getElementById("cfgLogoPreviewContainer").classList.add("hidden");
};

window.clearCfgStampSelection = function() {
    tempStampBase64 = "";
    document.getElementById("cfgStampInput").value = "";
    document.getElementById("cfgStampPreview").src = "";
    document.getElementById("cfgStampPreviewContainer").classList.add("hidden");
};

window.clearCfgSignKetuaSelection = function() {
    tempSignKetuaBase64 = "";
    document.getElementById("cfgSignKetuaInput").value = "";
    document.getElementById("cfgSignKetuaPreview").src = "";
    document.getElementById("cfgSignKetuaPreviewContainer").classList.add("hidden");
};

window.clearCfgSignBendaharaSelection = function() {
    tempSignBendaharaBase64 = "";
    document.getElementById("cfgSignBendaharaInput").value = "";
    document.getElementById("cfgSignBendaharaPreview").src = "";
    document.getElementById("cfgSignBendaharaPreviewContainer").classList.add("hidden");
};

// Set state depending on config keys presence
function initializeFirebaseConnection() {
    const dbBadge = document.getElementById("badgeDbMode");
    
    if (CONFIG.FIREBASE_CONFIG && CONFIG.FIREBASE_CONFIG.apiKey) {
        try {
            // Initialize Firebase App & Database compatibility
            firebase.initializeApp(CONFIG.FIREBASE_CONFIG);
            firebaseDatabase = firebase.database();
            isOnlineMode = true;
            
            if (dbBadge) {
                dbBadge.innerText = "Online (Firebase)";
                dbBadge.className = "badge badge-success text-[9px] font-bold px-1.5 py-1 border-0 uppercase text-white";
            }
        } catch (err) {
            console.error("Firebase Initialization Error:", err);
            isOnlineMode = false;
        }
    }

    if (!isOnlineMode && dbBadge) {
        dbBadge.innerText = "Offline (Lokal)";
        dbBadge.className = "badge badge-ghost text-[9px] font-bold px-1.5 py-1 border-0 uppercase bg-black/20 text-white";
    }
}

// Function to migrate flat-string categories to object-structured categories [{name, type}]
function migrateCategories(savedCats) {
    if (!savedCats) return [...DEFAULT_CATEGORIES];
    try {
        const parsed = typeof savedCats === 'string' ? JSON.parse(savedCats) : savedCats;
        if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_CATEGORIES];
        
        // If it's already an array of objects containing 'type'
        if (typeof parsed[0] === 'object' && parsed[0] !== null && 'type' in parsed[0]) {
            return parsed;
        }
        
        // Migrate strings array to objects array
        return parsed.map(cat => {
            const catLower = typeof cat === 'string' ? cat.toLowerCase() : (cat.name ? cat.name.toLowerCase() : "");
            const nameVal = typeof cat === 'string' ? cat : (cat.name || "Kategori Tanpa Nama");
            let type = "utama";
            
            if (catLower.includes("anak yatim") || 
                catLower.includes("yatim") || 
                catLower.includes("sosial") || 
                catLower.includes("kematian") || 
                catLower.includes("zakat") || 
                catLower.includes("infaq") || 
                catLower.includes("shodaqoh") || 
                catLower.includes("khusus") ||
                catLower.includes("phbi") ||
                catLower.includes("haji") ||
                catLower.includes("umroh")) {
                type = "khusus";
            }
            return { name: nameVal, type: type };
        });
    } catch (e) {
        console.error("Gagal melakukan migrasi kategori:", e);
        return [...DEFAULT_CATEGORIES];
    }
}

// Load data from Firebase or LocalStorage fallback
async function loadData() {
    if (isOnlineMode && firebaseDatabase) {
        try {
            console.log("Loading data dari cloud database Firebase...");

            // A. Load Settings
            const settingsSnap = await firebaseDatabase.ref("dkm_settings").once("value");
            if (settingsSnap.exists()) {
                settings = settingsSnap.val();
            } else {
                settings = { ...DEFAULT_SETTINGS };
                await firebaseDatabase.ref("dkm_settings").set(settings);
            }

            // B. Load Categories
            const categoriesSnap = await firebaseDatabase.ref("dkm_categories").once("value");
            if (categoriesSnap.exists()) {
                categories = migrateCategories(categoriesSnap.val());
            } else {
                categories = [...DEFAULT_CATEGORIES];
                await firebaseDatabase.ref("dkm_categories").set(categories);
            }

            // C. Load Transactions
            const transactionsSnap = await firebaseDatabase.ref("dkm_transactions").once("value");
            if (transactionsSnap.exists()) {
                const val = transactionsSnap.val();
                if (val) {
                    transactions = Array.isArray(val) ? val : Object.values(val);
                } else {
                    transactions = [];
                }
                
                // Ensure image field is initialized
                transactions.forEach(t => {
                    if (!('image' in t)) t.image = null;
                });
            } else {
                transactions = [...DEFAULT_TRANSACTIONS];
                await firebaseDatabase.ref("dkm_transactions").set(transactions);
            }

        } catch (error) {
            console.error("Gagal menyambungkan ke Firebase. Menggunakan data Lokal:", error);
            isOnlineMode = false;
            const dbBadge = document.getElementById("badgeDbMode");
            if (dbBadge) {
                dbBadge.innerText = "Offline (Gagal Sinkron)";
                dbBadge.className = "badge badge-error text-[9px] font-bold px-1.5 py-1 border-0 uppercase text-white";
            }
            loadLocalStorageData();
        }
    } else {
        loadLocalStorageData();
    }
}

// Load purely from browser LocalStorage
function loadLocalStorageData() {
    // 1. Load Settings
    const savedSettings = localStorage.getItem("dkm_settings");
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
    } else {
        settings = { ...DEFAULT_SETTINGS };
        localStorage.setItem("dkm_settings", JSON.stringify(settings));
    }

    // 2. Load Categories
    const savedCategories = localStorage.getItem("dkm_categories");
    categories = migrateCategories(savedCategories);
    localStorage.setItem("dkm_categories", JSON.stringify(categories));

    // 3. Load Transactions
    const savedTransactions = localStorage.getItem("dkm_transactions");
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    } else {
        transactions = [...DEFAULT_TRANSACTIONS];
        localStorage.setItem("dkm_transactions", JSON.stringify(transactions));
    }
}

// Sync all local state values into Firebase cloud (or local storage fallback)
async function syncData() {
    if (isOnlineMode && firebaseDatabase) {
        try {
            await firebaseDatabase.ref("dkm_transactions").set(transactions);
            await firebaseDatabase.ref("dkm_categories").set(categories);
            await firebaseDatabase.ref("dkm_settings").set(settings);
        } catch (err) {
            console.error("Gagal sinkronisasi data online ke Firebase:", err);
            showAlert("Gagal sinkronisasi cloud: " + err.message, "error");
            saveStateToLocalStorage();
        }
    } else {
        saveStateToLocalStorage();
    }
}

// Save current local state to local storage (for offline backups)
function saveStateToLocalStorage() {
    localStorage.setItem("dkm_transactions", JSON.stringify(transactions));
    localStorage.setItem("dkm_categories", JSON.stringify(categories));
    localStorage.setItem("dkm_settings", JSON.stringify(settings));
}

// Setup basic UI fields
function initializeUI() {
    // Toggle Admin Mode specific layouts
    toggleAdminUI();

    // Nav & Print Header
    document.getElementById("navMasjidName").innerText = settings.masjidName;
    document.getElementById("printMasjidName").innerText = settings.masjidName;
    
    // Set Print Info Date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById("printDate").innerText = `Dicetak pada: ${formattedDate}`;
    document.getElementById("printSignDate").innerText = `${settings.city || "Bekasi"}, ${formattedDate}`;

    // Fill Settings inputs
    if (document.getElementById("cfgMasjidName")) document.getElementById("cfgMasjidName").value = settings.masjidName || "";
    if (document.getElementById("cfgCity")) document.getElementById("cfgCity").value = settings.city || "Bekasi";
    if (document.getElementById("cfgAddress")) document.getElementById("cfgAddress").value = settings.address || "";
    if (document.getElementById("cfgTitleKetua")) document.getElementById("cfgTitleKetua").value = settings.titleKetua || "";
    if (document.getElementById("cfgNameKetua")) document.getElementById("cfgNameKetua").value = settings.nameKetua || "";
    if (document.getElementById("cfgTitleBendahara")) document.getElementById("cfgTitleBendahara").value = settings.titleBendahara || "";
    if (document.getElementById("cfgNameBendahara")) document.getElementById("cfgNameBendahara").value = settings.nameBendahara || "";

    // Fill Signatures and Logo in Print template
    if (document.getElementById("printTitleKetua")) document.getElementById("printTitleKetua").innerText = settings.titleKetua || "";
    if (document.getElementById("printNameKetua")) document.getElementById("printNameKetua").innerText = settings.nameKetua ? `( ${settings.nameKetua} )` : "( _______________________ )";
    if (document.getElementById("printTitleBendahara")) document.getElementById("printTitleBendahara").innerText = settings.titleBendahara || "";
    if (document.getElementById("printNameBendahara")) document.getElementById("printNameBendahara").innerText = settings.nameBendahara ? `( ${settings.nameBendahara} )` : "( _______________________ )";

    const printLogo = document.getElementById("printLogo");
    const printLogoContainer = document.getElementById("printLogoContainer");
    const printLogoPlaceholder = document.getElementById("printLogoPlaceholder");
    
    if (settings.logo) {
        if (printLogo) {
            printLogo.src = settings.logo;
            printLogo.classList.remove("hidden");
        }
        if (printLogoContainer) printLogoContainer.classList.remove("hidden");
        if (printLogoPlaceholder) printLogoPlaceholder.classList.remove("hidden");
    } else {
        if (printLogo) {
            printLogo.src = "";
            printLogo.classList.add("hidden");
        }
        if (printLogoContainer) printLogoContainer.classList.add("hidden");
        if (printLogoPlaceholder) printLogoPlaceholder.classList.add("hidden");
    }

    const printMasjidAddress = document.getElementById("printMasjidAddress");
    if (printMasjidAddress) {
        printMasjidAddress.innerText = settings.address || "";
        if (!settings.address) {
            printMasjidAddress.classList.add("hidden");
        } else {
            printMasjidAddress.classList.remove("hidden");
        }
    }

    const printSignKetua = document.getElementById("printSignKetua");
    const printSignKetuaSpace = document.getElementById("printSignKetuaSpace");
    if (settings.signKetua) {
        if (printSignKetua) {
            printSignKetua.src = settings.signKetua;
            printSignKetua.classList.remove("hidden");
        }
        if (printSignKetuaSpace) printSignKetuaSpace.classList.add("hidden");
    } else {
        if (printSignKetua) {
            printSignKetua.src = "";
            printSignKetua.classList.add("hidden");
        }
        if (printSignKetuaSpace) printSignKetuaSpace.classList.remove("hidden");
    }

    const printStamp = document.getElementById("printStamp");
    if (settings.stamp) {
        if (printStamp) {
            printStamp.src = settings.stamp;
            printStamp.classList.remove("hidden");
        }
    } else {
        if (printStamp) {
            printStamp.src = "";
            printStamp.classList.add("hidden");
        }
    }

    const printSignBendahara = document.getElementById("printSignBendahara");
    const printSignBendaharaSpace = document.getElementById("printSignBendaharaSpace");
    if (settings.signBendahara) {
        if (printSignBendahara) {
            printSignBendahara.src = settings.signBendahara;
            printSignBendahara.classList.remove("hidden");
        }
        if (printSignBendaharaSpace) printSignBendaharaSpace.classList.add("hidden");
    } else {
        if (printSignBendahara) {
            printSignBendahara.src = "";
            printSignBendahara.classList.add("hidden");
        }
        if (printSignBendaharaSpace) printSignBendaharaSpace.classList.remove("hidden");
    }

    // Populate Category selectors
    populateCategoryDropdowns();
    
    // Populate dynamic years filter
    populateYearFilter();
}

function initIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Show/Hide buttons and tabs based on admin authorization status
function toggleAdminUI() {
    const adminOnlyElements = document.querySelectorAll(".admin-only");
    adminOnlyElements.forEach(el => {
        if (isAdmin) {
            el.classList.remove("hidden");
        } else {
            el.classList.add("hidden");
        }
    });

    const btnHeaderSettings = document.getElementById("btnHeaderSettings");
    const btnHeaderBackup = document.getElementById("btnHeaderBackup");
    const btnLoginAdmin = document.getElementById("btnLoginAdmin");
    const adminSessionContainer = document.getElementById("adminSessionContainer");

    if (isAdmin) {
        if (btnHeaderSettings) btnHeaderSettings.classList.remove("hidden");
        if (btnHeaderBackup) btnHeaderBackup.classList.remove("hidden");
        if (btnLoginAdmin) btnLoginAdmin.classList.add("hidden");
        if (adminSessionContainer) {
            adminSessionContainer.classList.remove("hidden");
            adminSessionContainer.classList.add("flex");
        }
    } else {
        if (btnHeaderSettings) btnHeaderSettings.classList.add("hidden");
        if (btnHeaderBackup) btnHeaderBackup.classList.add("hidden");
        if (btnLoginAdmin) btnLoginAdmin.classList.remove("hidden");
        if (adminSessionContainer) {
            adminSessionContainer.classList.add("hidden");
            adminSessionContainer.classList.remove("flex");
        }
    }

    // Toggle Table Edit/Delete Column Header
    const colHeaderAksiUtama = document.getElementById("colHeaderAksiUtama");
    if (colHeaderAksiUtama) {
        if (isAdmin) colHeaderAksiUtama.classList.remove("hidden");
        else colHeaderAksiUtama.classList.add("hidden");
    }

    const colHeaderAksiKhusus = document.getElementById("colHeaderAksiKhusus");
    if (colHeaderAksiKhusus) {
        if (isAdmin) colHeaderAksiKhusus.classList.remove("hidden");
        else colHeaderAksiKhusus.classList.add("hidden");
    }
}

// ==================== NAVIGATION: KAS UTAMA VS KAS KHUSUS ====================

window.switchKasTab = function(tab) {
    currentKasTab = tab;
    
    const tabUtama = document.getElementById("tabKasUtama");
    const tabKhusus = document.getElementById("tabKasKhusus");

    const viewUtama = document.getElementById("viewKasUtama");
    const viewKhususGrid = document.getElementById("viewKasKhususGrid");
    const viewKhususDetails = document.getElementById("viewKasKhususDetails");

    if (tab === "utama") {
        // Tab UI
        tabUtama.classList.add("tab-active", "text-primary");
        tabUtama.classList.remove("text-gray-500");
        tabKhusus.classList.remove("tab-active", "text-primary");
        tabKhusus.classList.add("text-gray-500");

        // Views UI
        viewUtama.classList.remove("hidden");
        viewKhususGrid.classList.add("hidden");
        viewKhususDetails.classList.add("hidden");

        activeKhususCategory = null; // reset folder state
        populateCategoryDropdowns();
        applyFilters(); // Filter & Render Kas Utama
    } else {
        // Tab UI
        tabKhusus.classList.add("tab-active", "text-primary");
        tabKhusus.classList.remove("text-gray-500");
        tabUtama.classList.remove("tab-active", "text-primary");
        tabUtama.classList.add("text-gray-500");

        // Views UI
        viewUtama.classList.add("hidden");

        if (activeKhususCategory) {
            viewKhususGrid.classList.add("hidden");
            viewKhususDetails.classList.remove("hidden");
            populateCategoryDropdowns();
            applyFiltersKhusus();
        } else {
            viewKhususDetails.classList.add("hidden");
            viewKhususGrid.classList.remove("hidden");
            renderSpecialCashGrid();
        }
    }
};

// Renders the Grid Selection list for Special Cash Categories (FOLDER SELECTION MENU)
function renderSpecialCashGrid() {
    const container = document.getElementById("specialCashGridContainer");
    if (!container) return;

    container.innerHTML = "";

    const khususCategories = categories.filter(c => c.type === "khusus");

    if (khususCategories.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center p-12 bg-white shadow border border-gray-100 rounded-3xl text-gray-400">
                <i data-lucide="info" class="w-12 h-12 mx-auto text-gray-300 mb-2"></i>
                <p class="font-bold text-sm">Belum ada Menu Kas Khusus.</p>
                <p class="text-xs text-gray-400 mt-1">Silakan masuk sebagai Admin, lalu tambahkan Kategori Kas berjenis "Kas Khusus" di Pengaturan!</p>
            </div>
        `;
        initIcons();
        return;
    }

    khususCategories.forEach(cat => {
        // Calculate independent sub balance for this category alone
        let pIn = 0;
        let pOut = 0;
        transactions.forEach(tx => {
            if (tx.category === cat.name) {
                if (tx.type === "pemasukan") pIn += tx.amount;
                else pOut += tx.amount;
            }
        });
        const bal = pIn - pOut;

        const card = document.createElement("div");
        card.className = "card bg-white shadow hover:shadow-xl border border-gray-100 p-6 rounded-2xl hover:-translate-y-1 transition duration-300 cursor-pointer flex flex-col justify-between";
        card.onclick = () => openKhususFolder(cat.name);
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start gap-2">
                    <div class="p-3 bg-teal-50 text-teal-600 rounded-xl">
                        <i data-lucide="folder-open" class="w-6 h-6"></i>
                    </div>
                    <span class="badge badge-sm badge-outline text-teal-600 font-extrabold border-teal-500/20 bg-teal-50/50 text-[10px] uppercase px-2 py-2.5">Kas Khusus</span>
                </div>
                <h3 class="text-base font-bold text-slate-800 mt-4 leading-snug line-clamp-2" title="${cat.name}">${cat.name}</h3>
            </div>
            <div class="mt-6 pt-4 border-t border-gray-50 flex flex-col gap-1">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Saldo Tersimpan:</span>
                <span class="text-xl font-extrabold text-teal-600">${formatRupiah(bal)}</span>
            </div>
        `;
        container.appendChild(card);
    });

    initIcons();
}

// Enters into a dedicated Special Cash Category folder view
window.openKhususFolder = function(catName) {
    activeKhususCategory = catName;

    // Toggle DOM sections
    document.getElementById("viewKasKhususGrid").classList.add("hidden");
    document.getElementById("viewKasKhususDetails").classList.remove("hidden");

    // Paint Title
    document.getElementById("lblActiveKhususName").innerText = catName;

    // Reset pagination
    currentPageKhusus = 1;

    // Setup Local Filters / Dropdowns
    populateCategoryDropdowns();
    populateYearFilter();

    // Trigger filter calculation
    applyFiltersKhusus();
};

// Exits the single dedicated folder view back to the category grid list
window.backToKhususGrid = function() {
    activeKhususCategory = null;

    // Toggle DOM sections
    document.getElementById("viewKasKhususDetails").classList.add("hidden");
    document.getElementById("viewKasKhususGrid").classList.remove("hidden");

    // Re-render folder cards
    renderSpecialCashGrid();
};


// Populate transaction forms and filter dropdowns with categories
function populateCategoryDropdowns() {
    const filterSelectUtama = document.getElementById("filterCategoryUtama");
    const txSelect = document.getElementById("txCategory");

    // Save previous filter value
    const prevFilterVal = filterSelectUtama ? filterSelectUtama.value : "";

    if (filterSelectUtama) {
        filterSelectUtama.innerHTML = '<option value="">Semua Kategori</option>';
    }
    txSelect.innerHTML = '<option value="" disabled selected>-- Pilih Kategori --</option>';

    if (currentKasTab === "utama") {
        // Load only 'utama' categories
        const activeCategories = categories.filter(c => c.type === "utama");
        activeCategories.forEach(cat => {
            if (filterSelectUtama) {
                const optFilter = document.createElement("option");
                optFilter.value = cat.name;
                optFilter.innerText = cat.name;
                filterSelectUtama.appendChild(optFilter);
            }

            const optTx = document.createElement("option");
            optTx.value = cat.name;
            optTx.innerText = cat.name;
            txSelect.appendChild(optTx);
        });

        if (filterSelectUtama && activeCategories.map(c => c.name).includes(prevFilterVal)) {
            filterSelectUtama.value = prevFilterVal;
        }
    } else if (currentKasTab === "khusus" && activeKhususCategory) {
        // In dedicated folder details view: the ONLY category select-able in tx form is the active folder category!
        const optTx = document.createElement("option");
        optTx.value = activeKhususCategory;
        optTx.innerText = activeKhususCategory;
        txSelect.appendChild(optTx);
        
        // Force the tx form select dropdown to choose this option automatically
        txSelect.value = activeKhususCategory;
    }
}

// Populate years filter from available transactions
function populateYearFilter() {
    const yearSelectUtama = document.getElementById("filterYearUtama");
    const yearSelectKhusus = document.getElementById("filterYearKhusus");

    const prevValUtama = yearSelectUtama ? yearSelectUtama.value : "";
    const prevValKhusus = yearSelectKhusus ? yearSelectKhusus.value : "";

    if (yearSelectUtama) yearSelectUtama.innerHTML = '<option value="">Semua Tahun</option>';
    if (yearSelectKhusus) yearSelectKhusus.innerHTML = '<option value="">Semua Tahun</option>';

    const years = new Set();
    years.add(new Date().getFullYear());

    transactions.forEach(tx => {
        if (tx.date) {
            const year = tx.date.split("-")[0];
            years.add(parseInt(year));
        }
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);
    sortedYears.forEach(year => {
        if (yearSelectUtama) {
            const opt = document.createElement("option");
            opt.value = year;
            opt.innerText = year;
            yearSelectUtama.appendChild(opt);
        }
        if (yearSelectKhusus) {
            const opt = document.createElement("option");
            opt.value = year;
            opt.innerText = year;
            yearSelectKhusus.appendChild(opt);
        }
    });

    if (yearSelectUtama) yearSelectUtama.value = prevValUtama;
    if (yearSelectKhusus) yearSelectKhusus.value = prevValKhusus;
}

// --- IMAGE UPLOAD LOGIC ---

function setupImageUploadListener() {
    const fileInput = document.getElementById("txImageInput");
    if (fileInput) {
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                // Limit file size to 1.5MB to keep Supabase and LocalStorage light and fast
                if (file.size > 1.5 * 1024 * 1024) {
                    showAlert("Ukuran gambar terlalu besar! Maksimal 1.5 MB.", "error");
                    fileInput.value = "";
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(evt) {
                    tempSelectedImageBase64 = evt.target.result;
                    document.getElementById("txImagePreview").src = tempSelectedImageBase64;
                    document.getElementById("txImagePreviewContainer").classList.remove("hidden");
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

window.clearTxImageSelection = function() {
    tempSelectedImageBase64 = null;
    document.getElementById("txImageInput").value = "";
    document.getElementById("txImagePreview").src = "";
    document.getElementById("txImagePreviewContainer").classList.add("hidden");
};


// ==================== REPORT DETAILS POPUP (DETAIL MODAL) ====================

window.openTxDetailModal = function(id) {
    activeDetailTxId = id;
    const tx = transactions.find(t => t.id === id);
    if (!tx) {
        showAlert("Error: Transaksi tidak ditemukan!", "error");
        return;
    }

    const dateObj = new Date(tx.date);
    const formattedDate = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

    // Paint Fields
    document.getElementById("lblDetailModalCategoryBadge").innerText = tx.category;
    document.getElementById("lblDetailModalDate").innerText = formattedDate;
    document.getElementById("lblDetailModalAmount").innerText = formatRupiah(tx.amount);
    document.getElementById("lblDetailModalDesc").innerText = tx.desc;

    // Type styling
    const isIncome = tx.type === "pemasukan";
    const lblType = document.getElementById("lblDetailModalTypeBadge");
    const panelPriceCard = document.getElementById("panelDetailModalPriceCard");
    const lblPriceTitle = document.getElementById("lblDetailModalTypeTitle");
    const lblPriceAmount = document.getElementById("lblDetailModalAmount");

    if (isIncome) {
        lblType.innerText = "KAS MASUK (PEMASUKAN)";
        lblType.className = "font-bold mt-0.5 uppercase tracking-wide text-xs text-green-600";
        panelPriceCard.className = "p-4 rounded-2xl text-center border border-green-100 bg-green-50/20";
        lblPriceTitle.innerText = "Total Uang Masuk";
        lblPriceAmount.className = "text-2xl md:text-3xl font-black text-green-600";
    } else {
        lblType.innerText = "KAS KELUAR (PENGELUARAN)";
        lblType.className = "font-bold mt-0.5 uppercase tracking-wide text-xs text-red-500";
        panelPriceCard.className = "p-4 rounded-2xl text-center border border-red-100 bg-red-50/10";
        lblPriceTitle.innerText = "Total Uang Keluar";
        lblPriceAmount.className = "text-2xl md:text-3xl font-black text-red-500";
    }

    // Image Proof
    const imgEl = document.getElementById("lblDetailModalImage");
    const panelNoImg = document.getElementById("panelDetailModalNoImage");

    if (tx.image) {
        imgEl.src = tx.image;
        imgEl.classList.remove("hidden");
        panelNoImg.classList.add("hidden");
    } else {
        imgEl.src = "";
        imgEl.classList.add("hidden");
        panelNoImg.classList.remove("hidden");
    }

    // Render edit button inside detail modal if admin
    const btnEdit = document.getElementById("btnDetailModalEdit");
    if (isAdmin) {
        btnEdit.classList.remove("hidden");
    } else {
        btnEdit.classList.add("hidden");
    }

    document.getElementById("txDetailModal").showModal();
    initIcons();
};

window.closeTxDetailModal = function() {
    document.getElementById("txDetailModal").close();
    activeDetailTxId = null;
};

window.editTransactionFromDetail = function() {
    const editId = activeDetailTxId;
    closeTxDetailModal();
    editTransaction(editId);
};

window.viewFullImage = function() {
    const tx = transactions.find(t => t.id === activeDetailTxId);
    if (tx && tx.image) {
        document.getElementById("lblFullscreenImage").src = tx.image;
        document.getElementById("fullscreenImageModal").showModal();
        initIcons();
    }
};


// --- UTILITIES ---
function formatRupiah(num) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(num);
}

// --- ADMIN SESSION CONTROLLERS ---

window.openLoginModal = function() {
    document.getElementById("loginForm").reset();
    document.getElementById("loginModal").showModal();
};

window.closeLoginModal = function() {
    document.getElementById("loginModal").close();
};

window.handleLogin = function(e) {
    e.preventDefault();
    const enteredPass = document.getElementById("loginPassword").value;

    if (enteredPass === CONFIG.ADMIN_PASSWORD) {
        isAdmin = true;
        sessionStorage.setItem("dkm_is_admin", "true");
        toggleAdminUI();
        window.closeLoginModal();
        
        // Re-render layout
        if (currentKasTab === "utama") {
            applyFilters();
        } else if (activeKhususCategory) {
            applyFiltersKhusus();
        } else {
            renderSpecialCashGrid();
        }
        showAlert("Login Admin Berhasil! Semua hak akses terbuka.");
    } else {
        showAlert("Kata sandi salah! Akses ditolak.", "error");
    }
};

window.handleLogout = function() {
    isAdmin = false;
    sessionStorage.removeItem("dkm_is_admin");
    toggleAdminUI();
    
    // Re-render layout
    if (currentKasTab === "utama") {
        applyFilters();
    } else if (activeKhususCategory) {
        applyFiltersKhusus();
    } else {
        renderSpecialCashGrid();
    }
    showAlert("Anda telah keluar dari Mode Admin.", "info");
};


// ==================== RENDERING ENGINE: KAS UTAMA ====================

window.applyFilters = function() {
    if (currentKasTab !== "utama") return;

    const searchQuery = document.getElementById("filterSearchUtama").value.toLowerCase().trim();
    const catQuery = document.getElementById("filterCategoryUtama").value;
    const monthQuery = document.getElementById("filterMonthUtama").value;
    const yearQuery = document.getElementById("filterYearUtama").value;
    const startDateQuery = document.getElementById("filterStartDateUtama") ? document.getElementById("filterStartDateUtama").value : "";
    const endDateQuery = document.getElementById("filterEndDateUtama") ? document.getElementById("filterEndDateUtama").value : "";

    // Load only 'utama' categories names
    const tabCategories = categories.filter(c => c.type === "utama").map(c => c.name);

    filteredTransactionsGlobalUtama = transactions.filter(tx => {
        // Must belong to Kas Utama
        if (!tabCategories.includes(tx.category)) return false;

        // Search text filter
        const matchSearch = tx.desc.toLowerCase().includes(searchQuery) || 
                            tx.category.toLowerCase().includes(searchQuery);

        // Category filter
        const matchCat = catQuery === "" || tx.category === catQuery;

        // Date filter
        let matchDate = true;
        if (tx.date) {
            const parts = tx.date.split("-");
            const year = parts[0];
            const month = parts[1];

            const matchMonth = monthQuery === "" || month === monthQuery;
            const matchYear = yearQuery === "" || year === yearQuery;
            matchDate = matchMonth && matchYear;
        }

        // Date range filter
        let matchRange = true;
        if (tx.date) {
            if (startDateQuery && tx.date < startDateQuery) matchRange = false;
            if (endDateQuery && tx.date > endDateQuery) matchRange = false;
        }

        return matchSearch && matchCat && matchDate && matchRange;
    });

    filteredTransactionsGlobalUtama.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateB - dateA !== 0) return dateB - dateA;
        return b.id.localeCompare(a.id);
    });

    currentPageUtama = 1;

    renderKPIsUtama();
    renderTableUtama();
    renderChartsUtama();
};

function renderKPIsUtama() {
    const tabCategories = categories.filter(c => c.type === "utama").map(c => c.name);

    let totalIncome = 0;
    let totalExpense = 0;
    let countIncome = 0;
    let countExpense = 0;

    transactions.forEach(tx => {
        if (tabCategories.includes(tx.category)) {
            if (tx.type === "pemasukan") {
                totalIncome += tx.amount;
                countIncome++;
            } else {
                totalExpense += tx.amount;
                countExpense++;
            }
        }
    });

    const saldo = totalIncome - totalExpense;

    // Update Kas Utama Cards
    document.getElementById("cardSaldoUtama").innerText = formatRupiah(saldo);
    document.getElementById("cardPemasukanUtama").innerText = formatRupiah(totalIncome);
    document.getElementById("cardPengeluaranUtama").innerText = formatRupiah(totalExpense);

    document.getElementById("lblTotalPemasukanCountUtama").innerText = `${countIncome} Transaksi`;
    document.getElementById("lblTotalPengeluaranCountUtama").innerText = `${countExpense} Transaksi`;

    const lblSaldoStatusUtama = document.getElementById("lblSaldoStatusUtama");
    if (saldo > 5000000) {
        lblSaldoStatusUtama.innerText = "Keuangan Sangat Sehat";
        lblSaldoStatusUtama.className = "badge badge-sm bg-white/20 border-0 text-white mt-2 px-3 py-2.5 rounded-md font-medium";
    } else if (saldo >= 0) {
        lblSaldoStatusUtama.innerText = "Keuangan Stabil";
        lblSaldoStatusUtama.className = "badge badge-sm bg-white/20 border-0 text-white mt-2 px-3 py-2.5 rounded-md font-medium";
    } else {
        lblSaldoStatusUtama.innerText = "Defisit Keuangan!";
        lblSaldoStatusUtama.className = "badge badge-sm bg-red-500 border-0 text-white mt-2 px-3 py-2.5 rounded-md font-bold";
    }

    // Set Print Header Info
    document.getElementById("printReportTitle").innerText = "LAPORAN KEUANGAN KAS UTAMA MASJID";
    document.getElementById("lblPrintSaldoTitle").innerText = "Sisa Saldo Kas Utama";

    // Set Print overall totals card
    let pIncome = 0;
    let pExpense = 0;
    filteredTransactionsGlobalUtama.forEach(tx => {
        if (tx.type === "pemasukan") pIncome += tx.amount;
        else pExpense += tx.amount;
    });

    document.getElementById("printTotalPemasukan").innerText = formatRupiah(pIncome);
    document.getElementById("printTotalPengeluaran").innerText = formatRupiah(pExpense);
    document.getElementById("printTotalSaldo").innerText = formatRupiah(pIncome - pExpense);

    const monthQuery = document.getElementById("filterMonthUtama").value;
    const yearQuery = document.getElementById("filterYearUtama").value;
    const catQuery = document.getElementById("filterCategoryUtama").value;
    const startDateQuery = document.getElementById("filterStartDateUtama") ? document.getElementById("filterStartDateUtama").value : "";
    const endDateQuery = document.getElementById("filterEndDateUtama") ? document.getElementById("filterEndDateUtama").value : "";

    let periodStr = "Periode: ";
    if (startDateQuery || endDateQuery) {
        const startLabel = startDateQuery ? new Date(startDateQuery).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "...";
        const endLabel = endDateQuery ? new Date(endDateQuery).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "...";
        periodStr += `${startLabel} s.d. ${endLabel}`;
    } else if (monthQuery || yearQuery) {
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const mLabel = monthQuery ? monthNames[parseInt(monthQuery) - 1] : "";
        const yLabel = yearQuery ? yearQuery : "Semua Tahun";
        periodStr += mLabel ? `${mLabel} ${yLabel}` : yLabel;
    } else {
        periodStr += "Semua Transaksi";
    }
    
    if (catQuery) {
        periodStr += ` (${catQuery})`;
    }
    document.getElementById("printReportPeriod").innerText = periodStr;
}

function renderTableUtama() {
    const tableBody = document.getElementById("tableBodyUtama");
    const mobileList = document.getElementById("mobileListUtama");

    tableBody.innerHTML = "";
    mobileList.innerHTML = "";

    const totalFiltered = filteredTransactionsGlobalUtama.length;
    document.getElementById("lblSelectedCountUtama").innerText = `${totalFiltered} Data`;

    if (totalFiltered === 0) {
        const emptyStateTable = `
            <tr>
                <td colspan="${isAdmin ? 7 : 6}" class="text-center py-12 text-gray-400">
                    <div class="flex flex-col items-center gap-2">
                        <i data-lucide="info" class="w-8 h-8 text-gray-300"></i>
                        <p class="font-medium">Tidak ada transaksi yang cocok dengan filter.</p>
                    </div>
                </td>
            </tr>
        `;
        const emptyStateMobile = `
            <div class="text-center py-8 text-gray-400">
                <div class="flex flex-col items-center gap-2">
                    <i data-lucide="info" class="w-8 h-8 text-gray-300"></i>
                    <p class="font-medium">Tidak ada transaksi yang cocok dengan filter.</p>
                </div>
            </div>
        `;
        tableBody.innerHTML = emptyStateTable;
        mobileList.innerHTML = emptyStateMobile;
        
        document.getElementById("lblTableSummaryUtama").innerText = "Menampilkan 0 dari 0 transaksi";
        document.getElementById("btnPrevPageUtama").disabled = true;
        document.getElementById("btnNextPageUtama").disabled = true;
        document.getElementById("btnCurrentPageUtama").innerText = "1";
        
        initIcons();
        return;
    }

    const totalPages = Math.ceil(totalFiltered / itemsPerPage);
    if (currentPageUtama > totalPages) currentPageUtama = totalPages;
    if (currentPageUtama < 1) currentPageUtama = 1;

    const startIndex = (currentPageUtama - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalFiltered);
    const paginatedItems = filteredTransactionsGlobalUtama.slice(startIndex, endIndex);

    document.getElementById("lblTableSummaryUtama").innerText = `Menampilkan ${startIndex + 1}-${endIndex} dari ${totalFiltered} transaksi`;
    document.getElementById("btnCurrentPageUtama").innerText = currentPageUtama;
    document.getElementById("btnPrevPageUtama").disabled = currentPageUtama === 1;
    document.getElementById("btnNextPageUtama").disabled = currentPageUtama === totalPages;

    paginatedItems.forEach((tx, idx) => {
        const realIndex = startIndex + idx + 1;
        const formattedAmt = formatRupiah(tx.amount);
        const dateObj = new Date(tx.date);
        const formattedDate = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

        const isIncome = tx.type === "pemasukan";
        const badgeClass = isIncome ? "badge-success" : "badge-error";
        const typeLabel = isIncome ? "Masuk" : "Keluar";
        const rowAmountClass = isIncome ? "text-green-600 font-bold" : "text-red-500 font-semibold";
        const amountPrefix = isIncome ? "+" : "-";

        // Desktop Row (clickable to open detail modal)
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50/80 transition duration-150 border-b border-gray-100 cursor-pointer";
        tr.onclick = () => openTxDetailModal(tx.id);
        tr.innerHTML = `
            <td class="text-center font-semibold text-gray-400">${realIndex}</td>
            <td class="font-medium text-gray-500">${formattedDate}</td>
            <td><span class="font-bold text-gray-600 text-xs bg-slate-100 px-2.5 py-1 rounded">${tx.category}</span></td>
            <td class="max-w-xs truncate font-medium text-slate-800" title="${tx.desc}">${tx.desc}</td>
            <td class="text-center">
                <span class="badge ${badgeClass} text-white text-[10px] uppercase font-extrabold px-2.5 py-2.5 border-0 rounded-md">${typeLabel}</span>
            </td>
            <td class="text-right ${rowAmountClass}">${amountPrefix} ${formattedAmt}</td>
            ${isAdmin ? `
            <td class="text-center no-print" onclick="event.stopPropagation();">
                <div class="flex gap-1.5 justify-center">
                    <button onclick="editTransaction('${tx.id}')" class="btn btn-ghost btn-xs text-primary p-1 hover:bg-primary/10 rounded" title="Edit">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteTransaction('${tx.id}')" class="btn btn-ghost btn-xs text-error p-1 hover:bg-error/10 rounded" title="Hapus">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>` : ""}
        `;
        tableBody.appendChild(tr);

        // Mobile Card (clickable)
        const card = document.createElement("div");
        card.className = "card bg-white shadow-sm border border-gray-100 p-4 rounded-xl flex flex-col gap-3 cursor-pointer hover:border-gray-200 transition";
        card.onclick = () => openTxDetailModal(tx.id);
        card.innerHTML = `
            <div class="flex justify-between items-start gap-2">
                <div class="flex flex-col gap-1">
                    <span class="text-[10px] uppercase tracking-wide font-bold text-gray-400">${formattedDate}</span>
                    <span class="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded self-start">${tx.category}</span>
                </div>
                <span class="badge ${badgeClass} text-white text-[10px] uppercase font-extrabold px-2.5 py-2 border-0 rounded-md">${typeLabel}</span>
            </div>
            <p class="text-sm font-semibold text-slate-700 leading-snug">${tx.desc}</p>
            <div class="flex justify-between items-center border-t border-gray-100 pt-2.5 mt-0.5" onclick="event.stopPropagation();">
                <span class="text-base ${rowAmountClass}">${amountPrefix} ${formattedAmt}</span>
                ${isAdmin ? `
                <div class="flex gap-2">
                    <button onclick="editTransaction('${tx.id}')" class="btn btn-outline btn-primary btn-xs flex items-center gap-1 rounded-lg px-2">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit
                    </button>
                    <button onclick="deleteTransaction('${tx.id}')" class="btn btn-outline btn-error btn-xs flex items-center gap-1 rounded-lg px-2">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Hapus
                    </button>
                </div>` : ""}
            </div>
        `;
        mobileList.appendChild(card);
    });

    initIcons();
}

function changePageUtama(direction) {
    currentPageUtama += direction;
    renderTableUtama();
}

function renderChartsUtama() {
    renderMonthlyChartUtama();
    renderCategoryChartUtama();
}

function renderMonthlyChartUtama() {
    const ctx = document.getElementById("monthlyChartUtama").getContext("2d");
    if (!ctx) return;
    
    if (monthlyChartInstanceUtama) {
        monthlyChartInstanceUtama.destroy();
    }

    const activeYearFilter = document.getElementById("filterYearUtama").value;
    const targetYear = activeYearFilter ? parseInt(activeYearFilter) : new Date().getFullYear();

    const monthsData = Array.from({ length: 12 }, () => ({ income: 0, expense: 0 }));
    const indonesianMonths = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

    // Filter categories of type 'utama'
    const tabCategories = categories.filter(c => c.type === "utama").map(c => c.name);

    transactions.forEach(tx => {
        if (tx.date && tabCategories.includes(tx.category)) {
            const parts = tx.date.split("-");
            const y = parseInt(parts[0]);
            const m = parseInt(parts[1]) - 1;

            if (y === targetYear) {
                if (tx.type === "pemasukan") {
                    monthsData[m].income += tx.amount;
                } else {
                    monthsData[m].expense += tx.amount;
                }
            }
        }
    });

    const incomeDataset = monthsData.map(m => m.income);
    const expenseDataset = monthsData.map(m => m.expense);

    monthlyChartInstanceUtama = new Chart(ctx, {
        type: "bar",
        data: {
            labels: indonesianMonths,
            datasets: [
                {
                    label: "Pemasukan",
                    data: incomeDataset,
                    backgroundColor: "#10b981",
                    borderRadius: 4,
                },
                {
                    label: "Pengeluaran",
                    data: expenseDataset,
                    backgroundColor: "#f43f5e",
                    borderRadius: 4,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                    labels: {
                        font: { family: "Plus Jakarta Sans", size: 11, weight: "bold" },
                        boxWidth: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ` ${context.dataset.label}: ${formatRupiah(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            if (value >= 1000000) return "Rp " + (value / 1000000) + "M";
                            if (value >= 1000) return "Rp " + (value / 1000) + "Rb";
                            return "Rp " + value;
                        }
                    }
                }
            }
        }
    });
}

function renderCategoryChartUtama() {
    const ctx = document.getElementById("categoryChartUtama").getContext("2d");
    if (!ctx) return;

    if (categoryChartInstanceUtama) {
        categoryChartInstanceUtama.destroy();
    }

    const activeCategories = categories.filter(c => c.type === "utama");
    const catExpenses = {};
    activeCategories.forEach(cat => catExpenses[cat.name] = 0);

    let hasExpense = false;
    filteredTransactionsGlobalUtama.forEach(tx => {
        if (tx.type === "pengeluaran") {
            catExpenses[tx.category] = (catExpenses[tx.category] || 0) + tx.amount;
            hasExpense = true;
        }
    });

    const labels = [];
    const data = [];
    const bgColors = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#6b7280", "#14b8a6", "#aca3ff"];

    activeCategories.forEach(cat => {
        if (catExpenses[cat.name] > 0 || !hasExpense) {
            labels.push(cat.name);
            data.push(hasExpense ? catExpenses[cat.name] : 1);
        }
    });

    categoryChartInstanceUtama = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bgColors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: "#ffffff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        font: { family: "Plus Jakarta Sans", size: 9, weight: "bold" },
                        boxWidth: 10,
                        padding: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            if (!hasExpense) return " Belum ada pengeluaran";
                            return ` ${context.label}: ${formatRupiah(context.raw)}`;
                        }
                    }
                }
            },
            cutout: "65%"
        }
    });
}


// ==================== RENDERING ENGINE: KAS KHUSUS DETAILED FOLDER ====================

window.applyFiltersKhusus = function() {
    if (currentKasTab !== "khusus" || !activeKhususCategory) return;

    const searchQuery = document.getElementById("filterSearchKhusus").value.toLowerCase().trim();
    const monthQuery = document.getElementById("filterMonthKhusus").value;
    const yearQuery = document.getElementById("filterYearKhusus").value;
    const startDateQuery = document.getElementById("filterStartDateKhusus") ? document.getElementById("filterStartDateKhusus").value : "";
    const endDateQuery = document.getElementById("filterEndDateKhusus") ? document.getElementById("filterEndDateKhusus").value : "";

    filteredTransactionsGlobalKhusus = transactions.filter(tx => {
        // Must match active category exactly
        if (tx.category !== activeKhususCategory) return false;

        // Search text filter
        const matchSearch = tx.desc.toLowerCase().includes(searchQuery);

        // Date filter
        let matchDate = true;
        if (tx.date) {
            const parts = tx.date.split("-");
            const year = parts[0];
            const month = parts[1];

            const matchMonth = monthQuery === "" || month === monthQuery;
            const matchYear = yearQuery === "" || year === yearQuery;
            matchDate = matchMonth && matchYear;
        }

        // Date range filter
        let matchRange = true;
        if (tx.date) {
            if (startDateQuery && tx.date < startDateQuery) matchRange = false;
            if (endDateQuery && tx.date > endDateQuery) matchRange = false;
        }

        return matchSearch && matchDate && matchRange;
    });

    filteredTransactionsGlobalKhusus.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateB - dateA !== 0) return dateB - dateA;
        return b.id.localeCompare(a.id);
    });

    // Update Folder Specific UI Layout values
    renderKPIsKhusus();
    renderTableKhusus();
};

function renderKPIsKhusus() {
    let totalIncome = 0;
    let totalExpense = 0;
    let countIncome = 0;
    let countExpense = 0;

    // Calculate sum of only this specific folder (COMPLETELY INDEPENDENT)
    transactions.forEach(tx => {
        if (tx.category === activeKhususCategory) {
            if (tx.type === "pemasukan") {
                totalIncome += tx.amount;
                countIncome++;
            } else {
                totalExpense += tx.amount;
                countExpense++;
            }
        }
    });

    const saldo = totalIncome - totalExpense;

    // Render dedicated cards
    document.getElementById("cardSaldoKhusus").innerText = formatRupiah(saldo);
    document.getElementById("cardPemasukanKhusus").innerText = formatRupiah(totalIncome);
    document.getElementById("cardPengeluaranKhusus").innerText = formatRupiah(totalExpense);

    document.getElementById("lblTotalPemasukanCountKhusus").innerText = `${countIncome} Transaksi`;
    document.getElementById("lblTotalPengeluaranCountKhusus").innerText = `${countExpense} Transaksi`;

    const lblSaldoStatusKhusus = document.getElementById("lblSaldoStatusKhusus");
    if (saldo > 5000000) {
        lblSaldoStatusKhusus.innerText = "Keuangan Sangat Sehat";
        lblSaldoStatusKhusus.className = "badge badge-sm bg-white/20 border-0 text-white mt-2 px-3 py-2.5 rounded-md font-medium";
    } else if (saldo >= 0) {
        lblSaldoStatusKhusus.innerText = "Keuangan Stabil";
        lblSaldoStatusKhusus.className = "badge badge-sm bg-white/20 border-0 text-white mt-2 px-3 py-2.5 rounded-md font-medium";
    } else {
        lblSaldoStatusKhusus.innerText = "Defisit Keuangan!";
        lblSaldoStatusKhusus.className = "badge badge-sm bg-red-500 border-0 text-white mt-2 px-3 py-2.5 rounded-md font-bold";
    }

    // Set Print Header Info
    document.getElementById("printReportTitle").innerText = `LAPORAN KEUANGAN KAS KHUSUS: ${activeKhususCategory.toUpperCase()}`;
    document.getElementById("lblPrintSaldoTitle").innerText = "Sisa Saldo Kas Khusus ini";

    // Set Print overall totals card
    let pIncome = 0;
    let pExpense = 0;
    filteredTransactionsGlobalKhusus.forEach(tx => {
        if (tx.type === "pemasukan") pIncome += tx.amount;
        else pExpense += tx.amount;
    });

    document.getElementById("printTotalPemasukan").innerText = formatRupiah(pIncome);
    document.getElementById("printTotalPengeluaran").innerText = formatRupiah(pExpense);
    document.getElementById("printTotalSaldo").innerText = formatRupiah(pIncome - pExpense);

    const monthQuery = document.getElementById("filterMonthKhusus").value;
    const yearQuery = document.getElementById("filterYearKhusus").value;
    const startDateQuery = document.getElementById("filterStartDateKhusus") ? document.getElementById("filterStartDateKhusus").value : "";
    const endDateQuery = document.getElementById("filterEndDateKhusus") ? document.getElementById("filterEndDateKhusus").value : "";

    let periodStr = "Periode: ";
    if (startDateQuery || endDateQuery) {
        const startLabel = startDateQuery ? new Date(startDateQuery).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "...";
        const endLabel = endDateQuery ? new Date(endDateQuery).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "...";
        periodStr += `${startLabel} s.d. ${endLabel}`;
    } else if (monthQuery || yearQuery) {
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const mLabel = monthQuery ? monthNames[parseInt(monthQuery) - 1] : "";
        const yLabel = yearQuery ? yearQuery : "Semua Tahun";
        periodStr += mLabel ? `${mLabel} ${yLabel}` : yLabel;
    } else {
        periodStr += "Semua Transaksi";
    }
    document.getElementById("printReportPeriod").innerText = periodStr;
}

function renderTableKhusus() {
    const tableBody = document.getElementById("tableBodyKhusus");
    const mobileList = document.getElementById("mobileListKhusus");

    tableBody.innerHTML = "";
    mobileList.innerHTML = "";

    const totalFiltered = filteredTransactionsGlobalKhusus.length;
    document.getElementById("lblSelectedCountKhusus").innerText = `${totalFiltered} Data`;

    if (totalFiltered === 0) {
        const emptyStateTable = `
            <tr>
                <td colspan="${isAdmin ? 7 : 6}" class="text-center py-12 text-gray-400">
                    <div class="flex flex-col items-center gap-2">
                        <i data-lucide="info" class="w-8 h-8 text-gray-300"></i>
                        <p class="font-medium">Tidak ada transaksi yang cocok dengan filter.</p>
                    </div>
                </td>
            </tr>
        `;
        const emptyStateMobile = `
            <div class="text-center py-8 text-gray-400">
                <div class="flex flex-col items-center gap-2">
                    <i data-lucide="info" class="w-8 h-8 text-gray-300"></i>
                    <p class="font-medium">Tidak ada transaksi yang cocok dengan filter.</p>
                </div>
            </div>
        `;
        tableBody.innerHTML = emptyStateTable;
        mobileList.innerHTML = emptyStateMobile;
        
        document.getElementById("lblTableSummaryKhusus").innerText = "Menampilkan 0 dari 0 transaksi";
        document.getElementById("btnPrevPageKhusus").disabled = true;
        document.getElementById("btnNextPageKhusus").disabled = true;
        document.getElementById("btnCurrentPageKhusus").innerText = "1";
        
        initIcons();
        return;
    }

    const totalPages = Math.ceil(totalFiltered / itemsPerPage);
    if (currentPageKhusus > totalPages) currentPageKhusus = totalPages;
    if (currentPageKhusus < 1) currentPageKhusus = 1;

    const startIndex = (currentPageKhusus - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalFiltered);
    const paginatedItems = filteredTransactionsGlobalKhusus.slice(startIndex, endIndex);

    document.getElementById("lblTableSummaryKhusus").innerText = `Menampilkan ${startIndex + 1}-${endIndex} dari ${totalFiltered} transaksi`;
    document.getElementById("btnCurrentPageKhusus").innerText = currentPageKhusus;
    document.getElementById("btnPrevPageKhusus").disabled = currentPageKhusus === 1;
    document.getElementById("btnNextPageKhusus").disabled = currentPageKhusus === totalPages;

    paginatedItems.forEach((tx, idx) => {
        const realIndex = startIndex + idx + 1;
        const formattedAmt = formatRupiah(tx.amount);
        const dateObj = new Date(tx.date);
        const formattedDate = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

        const isIncome = tx.type === "pemasukan";
        const badgeClass = isIncome ? "badge-success" : "badge-error";
        const typeLabel = isIncome ? "Masuk" : "Keluar";
        const rowAmountClass = isIncome ? "text-green-600 font-bold" : "text-red-500 font-semibold";
        const amountPrefix = isIncome ? "+" : "-";

        // Desktop Row (clickable)
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50/80 transition duration-150 border-b border-gray-100 cursor-pointer";
        tr.onclick = () => openTxDetailModal(tx.id);
        tr.innerHTML = `
            <td class="text-center font-semibold text-gray-400">${realIndex}</td>
            <td class="font-medium text-gray-500">${formattedDate}</td>
            <td><span class="font-bold text-gray-600 text-xs bg-slate-100 px-2.5 py-1 rounded">${tx.category}</span></td>
            <td class="max-w-xs truncate font-medium text-slate-800" title="${tx.desc}">${tx.desc}</td>
            <td class="text-center">
                <span class="badge ${badgeClass} text-white text-[10px] uppercase font-extrabold px-2.5 py-2.5 border-0 rounded-md">${typeLabel}</span>
            </td>
            <td class="text-right ${rowAmountClass}">${amountPrefix} ${formattedAmt}</td>
            ${isAdmin ? `
            <td class="text-center no-print" onclick="event.stopPropagation();">
                <div class="flex gap-1.5 justify-center">
                    <button onclick="editTransaction('${tx.id}')" class="btn btn-ghost btn-xs text-primary p-1 hover:bg-primary/10 rounded" title="Edit">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteTransaction('${tx.id}')" class="btn btn-ghost btn-xs text-error p-1 hover:bg-error/10 rounded" title="Hapus">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>` : ""}
        `;
        tableBody.appendChild(tr);

        // Mobile Card (clickable)
        const card = document.createElement("div");
        card.className = "card bg-white shadow-sm border border-gray-100 p-4 rounded-xl flex flex-col gap-3 cursor-pointer hover:border-gray-200 transition";
        card.onclick = () => openTxDetailModal(tx.id);
        card.innerHTML = `
            <div class="flex justify-between items-start gap-2">
                <div class="flex flex-col gap-1">
                    <span class="text-[10px] uppercase tracking-wide font-bold text-gray-400">${formattedDate}</span>
                    <span class="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded self-start">${tx.category}</span>
                </div>
                <span class="badge ${badgeClass} text-white text-[10px] uppercase font-extrabold px-2.5 py-2 border-0 rounded-md">${typeLabel}</span>
            </div>
            <p class="text-sm font-semibold text-slate-700 leading-snug">${tx.desc}</p>
            <div class="flex justify-between items-center border-t border-gray-100 pt-2.5 mt-0.5" onclick="event.stopPropagation();">
                <span class="text-base ${rowAmountClass}">${amountPrefix} ${formattedAmt}</span>
                ${isAdmin ? `
                <div class="flex gap-2">
                    <button onclick="editTransaction('${tx.id}')" class="btn btn-outline btn-primary btn-xs flex items-center gap-1 rounded-lg px-2">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Edit
                    </button>
                    <button onclick="deleteTransaction('${tx.id}')" class="btn btn-outline btn-error btn-xs flex items-center gap-1 rounded-lg px-2">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Hapus
                    </button>
                </div>` : ""}
            </div>
        `;
        mobileList.appendChild(card);
    });

    initIcons();
}

function changePageKhusus(direction) {
    currentPageKhusus += direction;
    renderTableKhusus();
}


// --- CRUD OPERATIONS: TRANSACTION ---

window.openTransactionModal = function(type, existingId = null, isKhususFolder = false) {
    if (!isAdmin) {
        showAlert("Aksi ditolak! Anda harus masuk sebagai administrator.", "error");
        return;
    }

    const modal = document.getElementById("transactionModal");
    const form = document.getElementById("transactionForm");
    
    form.reset();
    document.getElementById("txId").value = "";
    document.getElementById("txType").value = type;

    // Reset Image Upload & Previews
    clearTxImageSelection();

    const today = new Date().toISOString().split("T")[0];
    document.getElementById("txDate").value = today;

    const modalTitle = document.getElementById("modalTxTitle");
    const submitBtn = document.getElementById("btnSubmitTx");

    if (type === "pemasukan") {
        modalTitle.innerHTML = `<i data-lucide="plus-circle" class="w-5 h-5 text-success"></i> Tambah Kas Masuk`;
        submitBtn.className = "btn btn-success text-white flex-1 shadow-lg shadow-success/20";
    } else {
        modalTitle.innerHTML = `<i data-lucide="minus-circle" class="w-5 h-5 text-error"></i> Tambah Kas Keluar`;
        submitBtn.className = "btn btn-error text-white flex-1 shadow-lg shadow-error/20";
    }

    // Populate dynamic categories dropdown for adding tx
    populateCategoryDropdowns();

    if (existingId) {
        const tx = transactions.find(t => t.id === existingId);
        if (tx) {
            document.getElementById("txId").value = tx.id;
            document.getElementById("txType").value = tx.type;
            document.getElementById("txDate").value = tx.date;
            document.getElementById("txCategory").value = tx.category;
            document.getElementById("txAmount").value = tx.amount;
            document.getElementById("txDesc").value = tx.desc;

            if (tx.image) {
                tempSelectedImageBase64 = tx.image;
                document.getElementById("txImagePreview").src = tx.image;
                document.getElementById("txImagePreviewContainer").classList.remove("hidden");
            }

            modalTitle.innerHTML = `<i data-lucide="edit-3" class="w-5 h-5 text-primary"></i> Edit Transaksi`;
            submitBtn.className = "btn btn-primary text-white flex-1 shadow-lg shadow-primary/20";
        }
    }

    modal.showModal();
    initIcons();
};

window.closeTransactionModal = function() {
    document.getElementById("transactionModal").close();
    clearTxImageSelection();
};

window.saveTransaction = async function(e) {
try {
    e.preventDefault();

    if (!isAdmin) {
        showAlert("Aksi ditolak! Anda bukan administrator.", "error");
        return;
    }

    const id = document.getElementById("txId").value;
    const type = document.getElementById("txType").value;
    const date = document.getElementById("txDate").value;
    const category = document.getElementById("txCategory").value;
    const amount = parseInt(document.getElementById("txAmount").value);
    const desc = document.getElementById("txDesc").value.trim();

    if (!date || !category || isNaN(amount) || !desc) {
        showAlert("Silakan isi semua bidang dengan benar!", "error");
        return;
    }

    let updatedTx = null;

    if (id) {
        // EDIT MODE
        updatedTx = { id, date, category, desc, type, amount, image: tempSelectedImageBase64 };
        const index = transactions.findIndex(t => t.id === id);
        
        if (index !== -1) {
            transactions[index] = updatedTx;
            await syncData();
            showAlert("Transaksi berhasil diperbarui.");
        }
    } else {
        // ADD NEW MODE
        const newId = "tx-" + Date.now() + Math.random().toString(36).substr(2, 4);
        updatedTx = { id: newId, date, category, desc, type, amount, image: tempSelectedImageBase64 };
        transactions.push(updatedTx);
        await syncData();
        showAlert("Transaksi baru berhasil ditambahkan.");
    }

    populateYearFilter();
    
    // Refresh active layout
    if (currentKasTab === "utama") {
        applyFilters();
    } else {
        applyFiltersKhusus();
    }
    
    initializeUI();
    closeTransactionModal();

} catch(err){ console.error(err); showAlert(err.message||'Terjadi kesalahan','error'); }
};

window.editTransaction = function(id) {
    const tx = transactions.find(t => t.id === id);
    if (tx) {
        // Check which tab/folder we are in
        const catObj = categories.find(c => c.name === tx.category);
        const isKhusus = catObj ? catObj.type === "khusus" : false;
        openTransactionModal(tx.type, id, isKhusus);
    }
};

window.deleteTransaction = async function(id) {
    if (!isAdmin) {
        showAlert("Aksi ditolak! Anda bukan administrator.", "error");
        return;
    }

    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
        transactions = transactions.filter(t => t.id !== id);
        await syncData();
        populateYearFilter();
        
        // Refresh active layouts
        if (currentKasTab === "utama") {
            applyFilters();
        } else {
            applyFiltersKhusus();
        }
        showAlert("Transaksi berhasil dihapus.", "info");
    }
};

// --- SYSTEM SETTINGS & CATEGORIES ---

window.openSettingsModal = function() {
    if (!isAdmin) return;
    switchTab('settings-general');
    renderSettingsCategories();

    // Populate general inputs
    if (document.getElementById("cfgMasjidName")) document.getElementById("cfgMasjidName").value = settings.masjidName || "";
    if (document.getElementById("cfgCity")) document.getElementById("cfgCity").value = settings.city || "";
    if (document.getElementById("cfgAddress")) document.getElementById("cfgAddress").value = settings.address || "";
    if (document.getElementById("cfgTitleKetua")) document.getElementById("cfgTitleKetua").value = settings.titleKetua || "";
    if (document.getElementById("cfgNameKetua")) document.getElementById("cfgNameKetua").value = settings.nameKetua || "";
    if (document.getElementById("cfgTitleBendahara")) document.getElementById("cfgTitleBendahara").value = settings.titleBendahara || "";
    if (document.getElementById("cfgNameBendahara")) document.getElementById("cfgNameBendahara").value = settings.nameBendahara || "";

    // Reset temporary image base64s from settings
    tempLogoBase64 = settings.logo || "";
    tempStampBase64 = settings.stamp || "";
    tempSignKetuaBase64 = settings.signKetua || "";
    tempSignBendaharaBase64 = settings.signBendahara || "";

    // Setup previews
    const logoPreview = document.getElementById("cfgLogoPreview");
    const logoPreviewContainer = document.getElementById("cfgLogoPreviewContainer");
    if (tempLogoBase64) {
        if (logoPreview) logoPreview.src = tempLogoBase64;
        if (logoPreviewContainer) logoPreviewContainer.classList.remove("hidden");
    } else {
        if (logoPreview) logoPreview.src = "";
        if (logoPreviewContainer) logoPreviewContainer.classList.add("hidden");
    }

    const stampPreview = document.getElementById("cfgStampPreview");
    const stampPreviewContainer = document.getElementById("cfgStampPreviewContainer");
    if (tempStampBase64) {
        if (stampPreview) stampPreview.src = tempStampBase64;
        if (stampPreviewContainer) stampPreviewContainer.classList.remove("hidden");
    } else {
        if (stampPreview) stampPreview.src = "";
        if (stampPreviewContainer) stampPreviewContainer.classList.add("hidden");
    }

    const signKetuaPreview = document.getElementById("cfgSignKetuaPreview");
    const signKetuaPreviewContainer = document.getElementById("cfgSignKetuaPreviewContainer");
    if (tempSignKetuaBase64) {
        if (signKetuaPreview) signKetuaPreview.src = tempSignKetuaBase64;
        if (signKetuaPreviewContainer) signKetuaPreviewContainer.classList.remove("hidden");
    } else {
        if (signKetuaPreview) signKetuaPreview.src = "";
        if (signKetuaPreviewContainer) signKetuaPreviewContainer.classList.add("hidden");
    }

    const signBendaharaPreview = document.getElementById("cfgSignBendaharaPreview");
    const signBendaharaPreviewContainer = document.getElementById("cfgSignBendaharaPreviewContainer");
    if (tempSignBendaharaBase64) {
        if (signBendaharaPreview) signBendaharaPreview.src = tempSignBendaharaBase64;
        if (signBendaharaPreviewContainer) signBendaharaPreviewContainer.classList.remove("hidden");
    } else {
        if (signBendaharaPreview) signBendaharaPreview.src = "";
        if (signBendaharaPreviewContainer) signBendaharaPreviewContainer.classList.add("hidden");
    }

    // Reset file inputs
    if (document.getElementById("cfgLogoInput")) document.getElementById("cfgLogoInput").value = "";
    if (document.getElementById("cfgStampInput")) document.getElementById("cfgStampInput").value = "";
    if (document.getElementById("cfgSignKetuaInput")) document.getElementById("cfgSignKetuaInput").value = "";
    if (document.getElementById("cfgSignBendaharaInput")) document.getElementById("cfgSignBendaharaInput").value = "";

    document.getElementById("settingsModal").showModal();
    initIcons();
};

window.closeSettingsModal = function() {
    document.getElementById("settingsModal").close();
};

window.switchTab = function(tabId) {
    const tabGen = document.getElementById("tab-general");
    const tabCat = document.getElementById("tab-categories");
    const panelGen = document.getElementById("panel-general");
    const panelCat = document.getElementById("panel-categories");

    if (tabId === 'settings-general') {
        tabGen.classList.add("tab-active");
        tabCat.classList.remove("tab-active");
        panelGen.classList.remove("hidden");
        panelCat.classList.add("hidden");
    } else {
        tabGen.classList.remove("tab-active");
        tabCat.classList.add("tab-active");
        panelGen.classList.add("hidden");
        panelCat.classList.remove("hidden");
    }
};

window.saveSettings = async function() {
    if (!isAdmin) return;

    settings = {
        ...settings,
        masjidName: document.getElementById("cfgMasjidName").value.trim() || settings.masjidName,
        city: document.getElementById("cfgCity") ? document.getElementById("cfgCity").value.trim() : (settings.city || "Bekasi"),
        address: document.getElementById("cfgAddress") ? document.getElementById("cfgAddress").value.trim() : (settings.address || ""),
        titleKetua: document.getElementById("cfgTitleKetua").value.trim() || settings.titleKetua,
        nameKetua: document.getElementById("cfgNameKetua").value.trim() || settings.nameKetua,
        titleBendahara: document.getElementById("cfgTitleBendahara").value.trim() || settings.titleBendahara,
        nameBendahara: document.getElementById("cfgNameBendahara").value.trim() || settings.nameBendahara,
        logo: tempLogoBase64 || "",
        stamp: tempStampBase64 || "",
        signKetua: tempSignKetuaBase64 || "",
        signBendahara: tempSignBendaharaBase64 || ""
    };

    await syncData();
    initializeUI();

    if (currentKasTab === "utama") applyFilters();
    else if (activeKhususCategory) applyFiltersKhusus();

    closeSettingsModal();
    showAlert("Pengaturan sistem berhasil disimpan.");
};

function renderSettingsCategories() {
    const container = document.getElementById("categoryListContainer");
    container.innerHTML = "";

    const categoryUsage = {};
    categories.forEach(c => categoryUsage[c.name] = 0);
    transactions.forEach(t => {
        categoryUsage[t.category] = (categoryUsage[t.category] || 0) + 1;
    });

    categories.forEach((cat, index) => {
        const usage = categoryUsage[cat.name] || 0;
        const isDeletable = usage === 0;

        const isUtama = cat.type === "utama";
        const typeBadge = isUtama ? 
            `<span class="badge badge-sm bg-primary/10 border-0 text-primary text-[10px] py-1.5 font-bold uppercase rounded">Kas Utama</span>` : 
            `<span class="badge badge-sm bg-teal-500/10 border-0 text-teal-600 text-[10px] py-1.5 font-bold uppercase rounded">Kas Khusus</span>`;

        const row = document.createElement("div");
        row.className = "flex justify-between items-center p-3.5 hover:bg-gray-50 transition";
        row.innerHTML = `
            <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-gray-700">${cat.name}</span>
                    ${typeBadge}
                </div>
                <span class="text-[10px] text-gray-400 font-medium">${usage} digunakan dalam transaksi</span>
            </div>
            ${isDeletable ? `
                <button onclick="deleteCategory(${index})" class="btn btn-ghost btn-xs text-error p-1 hover:bg-error/10 rounded" title="Hapus Kategori">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            ` : `
                <span class="badge badge-sm badge-ghost text-gray-400 text-[10px] py-2 font-bold uppercase rounded">Terkunci</span>
            `}
        `;
        container.appendChild(row);
    });

    initIcons();
}

window.addCategory = async function() {
    if (!isAdmin) return;

    const newCatInput = document.getElementById("newCatName");
    const val = newCatInput.value.trim();

    if (!val) {
        showAlert("Nama kategori tidak boleh kosong!", "error");
        return;
    }

    if (categories.map(c => c.name.toLowerCase()).includes(val.toLowerCase())) {
        showAlert("Kategori ini sudah terdaftar!", "error");
        return;
    }

    // Get selected type (utama / khusus)
    const catTypeRadio = document.querySelector('input[name="newCatType"]:checked');
    const catType = catTypeRadio ? catTypeRadio.value : "utama";

    const newCat = { name: val, type: catType };
    categories.push(newCat);

    await syncData();
    
    newCatInput.value = "";
    renderSettingsCategories();
    populateCategoryDropdowns();
    
    // Refresh filters
    if (currentKasTab === "utama") {
        applyFilters();
    } else if (activeKhususCategory) {
        applyFiltersKhusus();
    } else {
        renderSpecialCashGrid();
    }
    showAlert(`Kategori "${val}" (${catType === "utama" ? "Kas Utama" : "Kas Khusus"}) berhasil ditambahkan.`);
};

window.deleteCategory = async function(index) {
    if (!isAdmin) return;

    const catName = categories[index].name;
    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${catName}"?`)) {
        categories.splice(index, 1);
        await syncData();

        renderSettingsCategories();
        populateCategoryDropdowns();
        
        // Refresh active views
        if (currentKasTab === "utama") {
            applyFilters();
        } else if (activeKhususCategory) {
            applyFiltersKhusus();
        } else {
            renderSpecialCashGrid();
        }
        showAlert(`Kategori "${catName}" berhasil dihapus.`, "info");
    }
};

// --- DATA PORTABILITY: EXPORTS & BACKUPS ---

window.exportToCSV = function() {
    const list = currentKasTab === "utama" ? filteredTransactionsGlobalUtama : filteredTransactionsGlobalKhusus;
    if (list.length === 0) {
        showAlert("Tidak ada data transaksi untuk diekspor!", "error");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No,Tanggal,Kategori Kas,Keterangan,Tipe,Nominal\n";

    list.forEach((tx, idx) => {
        const sanitizedDesc = tx.desc.replace(/"/g, '""');
        const row = [
            idx + 1,
            tx.date,
            `"${tx.category}"`,
            `"${sanitizedDesc}"`,
            tx.type.toUpperCase(),
            tx.amount
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const titleFile = currentKasTab === "utama" ? "Utama" : activeKhususCategory.replace(/\s+/g, '_');
    link.setAttribute("download", `Laporan_Keuangan_DKM_${titleFile}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert("Ekspor CSV berhasil diunduh.");
};

window.openBackupModal = function() {
    if (!isAdmin) return;
    document.getElementById("backupModal").showModal();
};

window.closeBackupModal = function() {
    document.getElementById("backupModal").close();
};

window.exportDataJSON = function() {
    if (!isAdmin) return;

    const backupObj = {
        version: "1.0",
        timestamp: Date.now(),
        settings: settings,
        categories: categories,
        transactions: transactions
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    
    const todayStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `DKM_Keuangan_Backup_${todayStr}.json`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert("File cadangan JSON berhasil diunduh.");
};

window.importDataJSON = async function() {
    if (!isAdmin) return;

    const fileInput = document.getElementById("importFile");
    
    if (fileInput.files.length === 0) {
        showAlert("Silakan pilih file backup (.json) terlebih dahulu!", "error");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);

            if (!data.transactions || !data.categories || !data.settings) {
                throw new Error("Format file cadangan tidak valid!");
            }

            transactions = data.transactions;
            categories = migrateCategories(JSON.stringify(data.categories));
            settings = data.settings;

            // Sync Database (Directly atomic to Firebase cloud!)
            await syncData();

            initializeUI();
            
            // Reload UI
            if (currentKasTab === "utama") {
                applyFilters();
            } else if (activeKhususCategory) {
                applyFiltersKhusus();
            } else {
                renderSpecialCashGrid();
            }

            closeBackupModal();
            showAlert("Seluruh data cadangan berhasil dipulihkan!");
            fileInput.value = "";
        } catch (err) {
            showAlert("Gagal memulihkan data: " + err.message, "error");
        }
    };

    reader.readAsText(file);
};

window.resetData = async function() {
    if (!isAdmin) return;

    if (confirm("PERINGATAN: Semua data transaksi dan pengaturan akan dihapus dan dikembalikan ke bawaan pabrik. Tindakan ini tidak dapat dibatalkan! Apakah Anda yakin?")) {
        
        if (isOnlineMode && firebaseDatabase) {
            try {
                // Clear Firebase refs
                await firebaseDatabase.ref("dkm_transactions").remove();
                await firebaseDatabase.ref("dkm_categories").remove();
                await firebaseDatabase.ref("dkm_settings").remove();
            } catch (err) {
                console.error("Gagal membersihkan Firebase:", err);
            }
        }

        localStorage.clear();
        await loadData();
        initializeUI();
        
        // Reload UI
        if (currentKasTab === "utama") {
            applyFilters();
        } else if (activeKhususCategory) {
            applyFiltersKhusus();
        } else {
            renderSpecialCashGrid();
        }
        showAlert("Seluruh data telah berhasil di-reset ke bawaan pabrik.", "info");
    }
};

// --- BROWSER NATIVE PRINT HOOKS ---
window.addEventListener("beforeprint", () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById("printDate").innerText = `Dicetak pada: ${formattedDate}`;
    document.getElementById("printSignDate").innerText = `${settings.city || "Bekasi"}, ${formattedDate}`;
    
    // Choose active list
    const activeList = currentKasTab === "utama" ? filteredTransactionsGlobalUtama : filteredTransactionsGlobalKhusus;

    // Use dedicated print table body container (Solves the blank print bug completely!)
    const tableBody = document.getElementById("printTableBody");
    tableBody.innerHTML = "";

    activeList.forEach((tx, idx) => {
        const formattedAmt = formatRupiah(tx.amount);
        const dateObj = new Date(tx.date);
        const formattedDate = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

        const isIncome = tx.type === "pemasukan";
        const typeLabel = isIncome ? "Masuk" : "Keluar";
        const rowAmountClass = isIncome ? "text-green-600 font-bold" : "text-red-500 font-semibold";
        const amountPrefix = isIncome ? "+" : "-";

        const tr = document.createElement("tr");
        tr.className = "border-b border-gray-300";
        tr.innerHTML = `
            <td class="text-center font-semibold text-gray-500 border border-gray-300 p-2">${idx + 1}</td>
            <td class="text-gray-600 border border-gray-300 p-2">${formattedDate}</td>
            <td class="border border-gray-300 p-2"><span class="font-bold text-gray-700 text-xs">${tx.category}</span></td>
            <td class="text-slate-800 border border-gray-300 p-2">${tx.desc}</td>
            <td class="text-center border border-gray-300 p-2">
                <span class="text-[11px] font-bold uppercase ${isIncome ? 'text-green-600' : 'text-red-600'}">${typeLabel}</span>
            </td>
            <td class="text-right ${rowAmountClass} border border-gray-300 p-2">${amountPrefix} ${formattedAmt}</td>
        `;
        tableBody.appendChild(tr);
    });
});

window.addEventListener("afterprint", () => {
    if (currentKasTab === "utama") {
        renderTableUtama();
    } else {
        renderTableKhusus();
    }
});
