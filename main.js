import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// ============================================================
//  KİŞİSEL AYARLAR — Buradan kolayca özelleştirebilirsiniz!
// ============================================================

// 🔐 Giriş Şifresi
const APP_PASSWORD = 'Terlik.123'; // <-- Şifreyi buradan değiştirin

// ✉️ Zarf Başlıkları
const LETTER_1_LABEL = 'Sana Bir Not'; // <-- 1. zarfın etiketi
const LETTER_2_LABEL = 'Bizden Bir Parça'; // <-- 2. zarfın etiketi

const firebaseConfig = {
    apiKey: "AIzaSyAgm5GXyG3LK6H6SMpsRq5-NGQBiDPi9x4",
    authDomain: "yusuf-11c7a.firebaseapp.com",
    projectId: "yusuf-11c7a",
    storageBucket: "yusuf-11c7a.firebasestorage.app",
    messagingSenderId: "852712849682",
    appId: "1:852712849682:web:b76a11f1a25fa15542b3cb"
};

// Firebase Başlatma
let db;
let storage;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app); // Storage referansı
    console.log("Firebase bağlantısı başarılı.");
} catch (error) {
    console.warn("Firebase yapılandırması eksik veya hatalı. Lütfen main.js dosyasındaki firebaseConfig alanını doldurun.", error);
    // Hata olsa bile kodun geri kalanı çalışsın diye fake db objesi (Opsiyonel)
}


// --- MÜZİK MOTORU ---
const playlist = [
    {
        title: "Yaşlı Amca - Giderdi Hoşuma",
        url: "yasli.mp3"
    },
    {
        title: "İkiye On Kala - Bütün İstanbul Biliyo",
        url: "istanbul.mp3"
    },
    {
        title: "Görkem Sağlam - Hayatımın Nakaratı",
        url: "nakarat.mp3"
    }
];

let currentTrackIndex = 0;
const audioObj = new Audio();
let isPlaying = false;
let isUserInteracted = false;

const musicToggleBtn = document.getElementById('music-toggle');
const musicTitle = document.getElementById('music-title');
const musicPlayerContainer = document.getElementById('music-player');

// --- İLK YÜKLEME ---
// --- İLK YÜKLEME ---
window.addEventListener('DOMContentLoaded', () => {
    // Login Kontrolü
    const loginInput = document.getElementById('login-input');
    const loginBtn = document.getElementById('login-btn');
    const sceneLogin = document.getElementById('scene-login');

    // Enter tuşu desteği
    loginInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginBtn.click();
    });

    loginBtn.addEventListener('click', () => {
        const val = loginInput.value.trim().toLowerCase();
        if (val === APP_PASSWORD.toLowerCase()) {
            // Başarılı
            gsap.to(sceneLogin, {
                duration: 1,
                opacity: 0,
                onComplete: () => {
                    sceneLogin.classList.add('hidden');
                    // Müzik çalmaya başla (Opsiyonel, kullanıcı etkileşimi oldu)
                    // playAudio(); // İstenirse açılabilir
                }
            });
        } else {
            // Hatalı
            loginInput.classList.add('shake');
            loginInput.style.borderColor = '#ef5350';
            setTimeout(() => {
                loginInput.classList.remove('shake');
                loginInput.style.borderColor = '#8d6e63';
                loginInput.value = "";
            }, 500);
        }
    });

    musicTitle.innerText = playlist[currentTrackIndex].title;
    audioObj.src = playlist[currentTrackIndex].url;

    // Zarf etiketlerini değişkenlerden ayarla
    const label1 = document.getElementById('label-1');
    const label2 = document.getElementById('label-2');
    if (label1) label1.innerText = LETTER_1_LABEL;
    if (label2) label2.innerText = LETTER_2_LABEL;

    // Veritabanını dinlemeye başla (Eğer DB varsa)
    if (db) {
        listenForLetters();
        listenForPhotos();
    }
});

// --- MÜZİK KONTROLLERİ ---
async function playAudio() {
    musicToggleBtn.classList.add('loading');
    try {
        if (!audioObj.src) audioObj.src = playlist[currentTrackIndex].url;
        await audioObj.play();

        isPlaying = true;
        musicToggleBtn.classList.remove('loading');
        musicToggleBtn.innerHTML = "||";
        musicToggleBtn.classList.add('spinning-icon');
        musicTitle.innerText = playlist[currentTrackIndex].title;
        isUserInteracted = true;
    } catch (err) {
        console.error("Müzik çalma hatası:", err);
        musicToggleBtn.classList.remove('loading');
        musicToggleBtn.innerHTML = "▶";
        musicToggleBtn.classList.remove('spinning-icon');
    }
}

function pauseAudio() {
    audioObj.pause();
    isPlaying = false;
    musicToggleBtn.innerHTML = "▶";
    musicToggleBtn.classList.remove('spinning-icon');
}

musicToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isPlaying) {
        pauseAudio();
    } else {
        playAudio();
    }
});

audioObj.addEventListener('ended', () => {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    audioObj.src = playlist[currentTrackIndex].url;
    musicTitle.innerText = playlist[currentTrackIndex].title;
    playAudio();
});

audioObj.addEventListener('error', (e) => {
    console.warn("Dosya yüklenemedi, sıradakine geçiliyor...");
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    audioObj.src = playlist[currentTrackIndex].url;
    musicTitle.innerText = playlist[currentTrackIndex].title;
    if (isUserInteracted) playAudio();
});

// --- İÇERİK YÖNETİMİ ---
const letterContent = {
    letter1: `
        <strong>Sana Bir Not</strong>
        
        Sevgilim,
        
        Bazen düşünüyorum da, insan birini sevdiğini ne zaman gerçekten anlıyor?

        Belki birlikte gülerken, belki hiç konuşmadan yan yana otururken… Belki de sıradan bir günü, onunla geçirdiği için güzel bulmaya başladığında.

        Bizim de böyle küçük küçük biriktirdiğimiz şeyler var. Fotoğraflar, şarkılar, konuşmalar, gülüşler, birbirimize söylediğimiz saçma şeyler ve sadece ikimizin anlayabileceği o küçük anlar…

        Bu siteye baktığında aslında sadece birkaç fotoğraf ya da birkaç şarkı görme istiyorum. Her birinin arkasındaki anıyı hatırla. Çünkü benim için asıl güzel olan şey, o fotoğrafta nasıl göründüğümüz değil; o anı seninle yaşamış olmak.

        Belki zaman geçecek, bazı şeyler değişecek, hayat bizi farklı yerlere götürecek. Ama umarım dönüp buraya baktığımızda aynı şeyi hissederiz:

        “İyi ki o gün birbirimizi bulmuşuz.”

        Seninle daha çok fotoğraf, daha çok şarkı, daha çok anı biriktirmek dileğiyle…

        Ve eğer bir gün bu sayfadaki her şeyi unutursak bile, bir şeyi unutmayalım:

        Ben seni, hayatımın en güzel anılarının arasına değil, hayatımın kendisine koydum.

        Seni seviyorum.
    `,

    letter2: `
        <strong>Bizden Bir Parça</strong>
        Sana söylemek istediğim çok büyük şeyler yok aslında.

        Sadece iyi ki varsın.
        İyi ki hayatımın bir yerinde sen varsın.
        Ve iyi ki seni tanımışım.

        Bazen hiçbir şey yapmadan bile günümü güzelleştiriyorsun.
        Galiba en sevdiğim şey de bu..
        Sadece sen olarak bile bana iyi gelmen🤍

        Seni çok seviyorum🫠
    `
};

let currentActiveLetter = "";

// --- ELEMENTLER ---
const sceneLanding = document.getElementById('scene-landing');
const sceneSelection = document.getElementById('scene-selection');
const sceneReading = document.getElementById('scene-reading');

const startBtn = document.getElementById('start-btn');
const introText = document.getElementById('intro-text');
const envelopesWrapper = document.querySelector('.envelopes-wrapper');
const envelopes = document.querySelectorAll('.envelope-container');

const parchmentContainer = document.getElementById('parchment-container');
const letterText = document.getElementById('letter-text');
const closeArea = document.getElementById('close-area');
const overlayBg = document.querySelector('.overlay-bg');
const closeBtnText = document.getElementById('close-btn-text');


// --- YAZMA MODÜLÜ ELEMENTLERİ ---
const writeBtn = document.getElementById('write-btn');
const writingModal = document.getElementById('writing-modal');
const overlayBgWrite = document.querySelector('.overlay-bg-write');
const writingParchment = document.querySelector('.writing-parchment');
const closeWriteBtn = document.getElementById('close-write-btn');
const sealBtn = document.getElementById('seal-btn');
const writeTitleInput = document.getElementById('write-title');
const writeBodyInput = document.getElementById('write-body');
const sentEnvelopesArea = document.getElementById('sent-envelopes-area');

// --- ALBÜM ELEMENTLERİ ---
const sceneAlbum = document.getElementById('scene-album');
const albumBtn = document.getElementById('album-btn');
const closeAlbumBtn = document.getElementById('close-album-btn');
const uploadTriggerBtn = document.getElementById('upload-trigger-btn');
const photoUploadInput = document.getElementById('photo-upload-input');
const albumGrid = document.getElementById('album-grid');


// --- GEÇİŞLER (GSAP) ---

startBtn.addEventListener('click', () => {
    // Kontrolleri görünür yap
    gsap.to([musicPlayerContainer, albumBtn, writeBtn], {
        duration: 1,
        opacity: 1,
        pointerEvents: "all",
        stagger: 0.2,
        delay: 0.5
    });

    gsap.to(sentEnvelopesArea, {
        duration: 1,
        opacity: 1,
        delay: 0.5
    });

    playAudio();

    gsap.to(sceneLanding, {
        duration: 1,
        autoAlpha: 0,
        y: -50,
        ease: "power2.in",
        onComplete: () => {
            startSelectionAnimation();
        }
    });
});

function startSelectionAnimation() {
    gsap.set(sceneSelection, { autoAlpha: 1, pointerEvents: "all" });

    const tl = gsap.timeline();

    tl.fromTo(introText,
        { opacity: 0, y: 30 },
        { duration: 1.5, opacity: 1, y: 0, ease: "power2.out" }
    )
        .to(introText, {
            duration: 1.2,
            y: -120,
            scale: 0.9,
            opacity: 0.8,
            delay: 1.5,
            ease: "power2.inOut"
        })
        .to(envelopesWrapper, { duration: 0.5, opacity: 1 }, "-=0.8")
        .from(envelopes, {
            duration: 1,
            y: 100,
            opacity: 0,
            stagger: 0.2,
            ease: "back.out(1.7)"
        }, "-=0.3");
}

// --- HOŞ GELDİN OVERLAYY ---
const welcomeOverlay = document.getElementById('welcome-overlay');
const welcomeParticles = document.getElementById('welcome-particles');
const welcomeQuote = document.getElementById('welcome-quote');

// ✨ Özelleştirilebilir: 2. zarfa tıklanınca gösterilecek alıntılar
const WELCOME_QUOTES = [
    'Güzel şeyler acele etmez,\nbir gün aniden karşında bulursun kendini.',
    'Her mektup,\nbir anda donmuş bir sestir.',
    'En değerli şeyler\nkelimelerle bile tam tarif edilemez.'
];

function createSparkles() {
    welcomeParticles.innerHTML = '';
    const count = 60;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.classList.add('sparkle-particle');

        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random() * 5 + 2;
        const delay = Math.random() * 2;
        const duration = Math.random() * 3 + 2;
        const hue = Math.random() < 0.5 ? '45' : '220';

        p.style.left = `${x}%`;
        p.style.top = `${y}%`;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.setProperty('--sp-delay', `${delay}s`);
        p.style.setProperty('--sp-duration', `${duration}s`);
        p.style.setProperty('--sp-hue', hue);

        welcomeParticles.appendChild(p);
    }
}

function triggerWelcomeSurprise(callback) {
    const quote = WELCOME_QUOTES[Math.floor(Math.random() * WELCOME_QUOTES.length)];
    welcomeQuote.innerHTML = quote.replace(/\n/g, '<br>');

    createSparkles();
    welcomeOverlay.classList.add('active');

    // Yazıyı fade-in'le
    gsap.fromTo(welcomeQuote,
        { opacity: 0, y: 30, scale: 0.95 },
        { duration: 1.2, opacity: 1, y: 0, scale: 1, ease: 'power2.out', delay: 0.4 }
    );

    // 3 sn sonra kapat ve mektubu aç
    gsap.to(welcomeOverlay, {
        duration: 1,
        opacity: 0,
        delay: 3,
        ease: 'power2.in',
        onComplete: () => {
            welcomeOverlay.classList.remove('active');
            welcomeParticles.innerHTML = '';
            gsap.set(welcomeOverlay, { opacity: 1 }); // sıfırla
            callback();
        }
    });
}

// --- ZARF TIKLAMA ---
envelopes.forEach(env => {
    env.addEventListener('click', function () {
        const letterType = this.getAttribute('data-letter');

        // 2. zarfa ilk tıklamada welcome sürprizi
        if (letterType === 'letter2') {
            let hasSeen = false;
            try { hasSeen = sessionStorage.getItem('hasSeenWelcome_v1'); } catch (e) { }

            if (!hasSeen) {
                try { sessionStorage.setItem('hasSeenWelcome_v1', 'true'); } catch (e) { }

                const rect = this.getBoundingClientRect();
                triggerWelcomeSurprise(() => {
                    currentActiveLetter = letterContent[letterType];
                    openReadingMode(rect, currentActiveLetter);
                });
                return;
            }
        }

        currentActiveLetter = letterContent[letterType];
        const rect = this.getBoundingClientRect();
        openReadingMode(rect, currentActiveLetter);
    });
});

function openReadingMode(rect, contentHtml) {
    letterText.innerHTML = contentHtml;

    const envCenterX = rect.left + rect.width / 2;
    const envCenterY = rect.top + rect.height / 2;

    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;

    const startX = envCenterX - screenCenterX;
    const startY = envCenterY - screenCenterY;

    gsap.set(sceneReading, { autoAlpha: 1, pointerEvents: "all" });
    gsap.to(overlayBg, { duration: 0.5, opacity: 1 });

    gsap.fromTo(parchmentContainer,
        {
            x: startX,
            y: startY,
            scale: 0.1,
            rotation: -10,
            opacity: 0
        },
        {
            duration: 1.2,
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            opacity: 1,
            ease: "power3.inOut",
            delay: 0.05
        }
    );
}

// --- KAPATMA FONKSİYONU ---
function closeLetter() {
    gsap.to(parchmentContainer, {
        duration: 0.5, scale: 0.5, opacity: 0, rotation: 10, ease: "power2.in"
    });

    gsap.to(overlayBg, {
        duration: 0.5, opacity: 0, delay: 0.1,
        onComplete: () => {
            gsap.set(sceneReading, { autoAlpha: 0, pointerEvents: "none" });
        }
    });
}

closeBtnText.addEventListener('click', closeLetter);
closeArea.addEventListener('click', closeLetter);


// --- YAZMA MODÜLÜ MANTIĞI ---

writeBtn.addEventListener('click', () => {
    gsap.set(writingModal, { autoAlpha: 1 });
    gsap.to(overlayBgWrite, { duration: 0.5, opacity: 1 });
    gsap.fromTo(writingParchment,
        { y: 50, opacity: 0, scale: 0.9 },
        { duration: 0.8, y: 0, opacity: 1, scale: 1, ease: "back.out(1.4)" }
    );
});

function closeWriteModal() {
    gsap.to(writingParchment, {
        duration: 0.5, y: 50, opacity: 0, scale: 0.9, ease: "power2.in"
    });
    gsap.to(overlayBgWrite, {
        duration: 0.5, opacity: 0,
        onComplete: () => {
            gsap.set(writingModal, { autoAlpha: 0 });
            setTimeout(() => {
                writeTitleInput.value = "";
                writeBodyInput.value = "";
            }, 500);
        }
    });
}

closeWriteBtn.addEventListener('click', closeWriteModal);
overlayBgWrite.addEventListener('click', closeWriteModal);

// MEKTUP MÜHÜRLEME VE KAYDETME
sealBtn.addEventListener('click', async () => {
    const title = writeTitleInput.value.trim();
    const body = writeBodyInput.value.trim();

    if (!title && !body) {
        gsap.to(writingParchment, { x: 10, duration: 0.1, yoyo: true, repeat: 5 });
        return;
    }

    // 1. Veritabanına Kaydet (Eğer DB varsa)
    let saved = false;
    if (db) {
        try {
            // Butonu pasif yap
            sealBtn.innerText = "Mühürleniyor...";
            sealBtn.style.pointerEvents = "none";

            await addDoc(collection(db, "letters"), {
                title: title || "Adsız Mektup",
                body: body,
                createdAt: serverTimestamp()
            });
            saved = true;
        } catch (e) {
            console.error("Kayıt hatası: ", e);
            alert("Mektup mühürlenirken bir hata oluştu.");
        } finally {
            sealBtn.innerText = "Mühürle";
            sealBtn.style.pointerEvents = "auto";
        }
    } else {
        // DB yoksa sadece animasyon oynasın (Demo modu)
        saved = true;
    }

    if (!saved) return;

    // 2. Animasyon başlat
    const tl = gsap.timeline();

    tl.to(writingParchment, {
        duration: 0.8,
        scaleY: 0.1,
        scaleX: 0.5,
        opacity: 0,
        ease: "power2.in",
        onComplete: () => {
            // Eğer DB varsa realtime listener zaten ekleyecek
            // Eğer DB yoksa manuel ekle
            if (!db) {
                createSentEnvelope(null, title || "Adsız Mektup", body);
            }
            closeWriteModal();
        }
    });
});

// ZARF POZİSYON HESAPLAMA
function calculateEnvelopePosition(index) {
    const step = 70;
    const startOffset = 120; // Albüm butonu arkasında kalmasın diye öteledik
    const padding = 40;
    const availableWidth = window.innerWidth - padding - startOffset;

    const capacity = Math.floor(availableWidth / step);
    const safeCapacity = capacity > 0 ? capacity : 1;

    const row = Math.floor(index / safeCapacity);
    const col = index % safeCapacity;

    return {
        left: startOffset + (col * step),
        bottom: 10 + (row * 30),
        zIndex: 150 - row
    };
}

// ZARF YARATMA (UI)
function createSentEnvelope(docId, title, body, isAnimated = true) {
    const envDiv = document.createElement('div');
    envDiv.classList.add('small-envelope');
    if (docId) envDiv.id = `letter-${docId}`; // ID ata

    const rotation = Math.random() * 10 - 5;
    envDiv.style.setProperty('--rotation', `${rotation}deg`);

    // KONUMLANDIRMA
    const index = sentEnvelopesArea.children.length;
    const pos = calculateEnvelopePosition(index);
    envDiv.style.left = `${pos.left}px`;
    envDiv.style.bottom = `${pos.bottom}px`;
    envDiv.style.zIndex = pos.zIndex;

    const titleDiv = document.createElement('div');
    titleDiv.classList.add('small-envelope-title');
    titleDiv.innerText = title;
    envDiv.appendChild(titleDiv);

    // SİLME BUTONU (Soft Delete -> Hard Delete)
    const delBtn = document.createElement('div');
    delBtn.innerHTML = "×";
    delBtn.classList.add('delete-envelope-btn');
    delBtn.title = "Mektubu Kaldır";

    delBtn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Mektubu açmayı engelle

        if (!confirm("Bu mektubu silmek istediğinize emin misiniz?")) return;

        // UI'dan silme animasyonu (Hemen başlatıyoruz, fail olursa geri almayacağız çünkü basit tutuyoruz)
        gsap.to(envDiv, {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            ease: "back.in(1.7)",
            onComplete: () => {
                envDiv.remove();
            }
        });

        // Veritabanından Silme (Hard Delete)
        if (db && docId) {
            try {
                await deleteDoc(doc(db, "letters", docId));
                console.log("Mektup silindi:", docId);
            } catch (err) {
                console.error("Silme hatası:", err);
                alert("Veritabanından silinirken hata oluştu.");
            }
        }
    });

    envDiv.appendChild(delBtn);

    envDiv.addEventListener('click', function () {
        const fullContent = `
            <strong>${title}</strong>
            ${body ? body.replace(/\n/g, '<br>') : '...'}
        `;
        const rect = this.getBoundingClientRect();
        openReadingMode(rect, fullContent);
    });

    sentEnvelopesArea.appendChild(envDiv);

    // Animasyon sadece yeni ekleniyorsa (DB'den ilk yüklemede olmasın diye)
    if (isAnimated) {
        const rect = envDiv.getBoundingClientRect();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top + rect.height / 2;
        const startX = centerX - targetX;
        const startY = centerY - targetY;

        gsap.fromTo(envDiv,
            { x: startX, y: startY, scale: 2, opacity: 0 },
            {
                duration: 1.2, x: 0, y: 0, scale: 1, opacity: 1, ease: "bounce.out"
            }
        );
    }
}

// VERİTABANI DİNLEME
function listenForLetters() {
    const q = query(collection(db, "letters"), orderBy("createdAt", "asc"));

    onSnapshot(q, (snapshot) => {
        // Mevcutları temizle (veya akıllıca ekle ama basitlik için temizleyip yeniden basabiliriz, fakat animasyon bozulur)
        // Daha iyi yöntem: Sadece docChanges iterasyonunu kullan
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const data = change.doc.data();
                // Sayfa ilk açıldığında animasyonsuz, sonradan eklenenler (örn. bu oturumda) animasyonlu olabilir mi?
                // Metadata ile kontrol edebiliriz ama şimdilik sadece yüklemede animasyon kapalı olsun
                // Bunu anlamak için snapshot metadata'ya bakabiliriz veya basitçe
                // "ilk yükleme bitti" flag'i kullanabiliriz.

                // Şimdilik basitçe: Veritabanından gelen her şeyi ekle.
                // Eğer bu ekleme işlemi sayfa yüklemesinden sonra kullanıcının kendi eklemesiyse animasyonlu olsun.
                // Bunu ayırt etmek zor olduğundan, şimdilik hepsini animasyonsuz ekleyelim, 
                // ya da sadece o an "Mühürle" butonuna basıldıysa animasyonu o tetiklesin?

                // ÇÖZÜM: createSentEnvelope içinde animasyonu opsiyonel yaptık.
                // onSnapshot ilk kez çalıştığında tüm veriyi getirir.
                // Bunu şöyle yönetelim: Sadece DOM'da olmayanları ekleyelim.

                // Fakat snapshot.docChanges() zaten delta verir.
                // Sayfa yenilendiğinde hepsi "added" olarak gelir.

                // Basit çözüm: Eğer bu client'ın "sealBtn" işlemiyle çakışıyorsa animasyon yönetimi karışabilir.
                // En temizi: Seal butonundaki animasyon sadece "kağıdın gidişini" yapsın.
                // Zarfın düşüşünü burası yapsın.

                // Sayfa ilk yüklendiğinde (flush) animasyon olmasın istiyorsak:
                // Sayfa ilk yüklendiğinde (flush) animasyon olmasın istiyorsak:
                createSentEnvelope(change.doc.id, data.title, data.body, false); // Varsayılan animasyonsuz
            }
        });
    });
}

// EKRAN BOYUTU DEĞİŞİRSE YENİDEN SIRALA
window.addEventListener('resize', () => {
    const envelopes = document.querySelectorAll('.small-envelope');
    envelopes.forEach((env, i) => {
        const pos = calculateEnvelopePosition(i);
        env.style.left = `${pos.left}px`;
        env.style.bottom = `${pos.bottom}px`;
        env.style.zIndex = pos.zIndex;
    });
});

// --- ALBÜM FONKSİYONLARI ---

// 1. Albüm Aç/Kapat
albumBtn.addEventListener('click', () => {
    gsap.set(sceneAlbum, { autoAlpha: 1, pointerEvents: "all" });
    gsap.fromTo(sceneAlbum,
        { y: "100%" },
        { duration: 1, y: "0%", ease: "power3.inOut" }
    );
});

closeAlbumBtn.addEventListener('click', () => {
    gsap.to(sceneAlbum, {
        duration: 0.8,
        y: "100%",
        ease: "power3.inOut",
        onComplete: () => {
            gsap.set(sceneAlbum, { autoAlpha: 0, pointerEvents: "none" });
        }
    });
});

// 2. Fotoğraf Yükleme Tetikleyici
uploadTriggerBtn.addEventListener('click', () => {
    photoUploadInput.click();
});

// 3. Dosya Seçilince Yükle (TOPLU - Çoklu Seçim Destekli)
photoUploadInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (!storage) {
        alert("Fotoğraf yükleyebilmek için Firebase Storage etkinleştirilmelidir.");
        return;
    }

    const total = files.length;
    let done = 0;

    uploadTriggerBtn.classList.add('loading');
    uploadTriggerBtn.innerText = `Yükleniyor 0/${total}`;

    // Her dosyayı paralel yükle
    const uploadPromises = files.map(async (file) => {
        const uniqueName = `photo_${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;
        const storageRef = ref(storage, 'photos/' + uniqueName);

        try {
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);

            await addDoc(collection(db, "photos"), {
                url: downloadUrl,
                storagePath: 'photos/' + uniqueName,
                createdAt: serverTimestamp()
            });

            done++;
            uploadTriggerBtn.innerText = `Yükleniyor ${done}/${total}`;
        } catch (err) {
            console.error(`"${file.name}" yüklenemedi:`, err);
            done++;
            uploadTriggerBtn.innerText = `Yükleniyor ${done}/${total}`;
            throw err;
        }
    });

    const results = await Promise.allSettled(uploadPromises);
    const failed = results.filter(r => r.status === 'rejected').length;

    if (failed === 0) {
        uploadTriggerBtn.innerText = `✓ ${total} fotoğraf eklendi`;
    } else {
        uploadTriggerBtn.innerText = `${total - failed}/${total} yüklendi (${failed} başarısız)`;
    }

    setTimeout(() => {
        uploadTriggerBtn.innerText = "Fotoğraf Ekle +";
        uploadTriggerBtn.classList.remove('loading');
    }, 2500);

    photoUploadInput.value = "";
});


// 4. Fotoğrafları Dinle ve Listele
function listenForPhotos() {
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));

    // İlk dinlemede grid boşaltılabilir veya append mantığı
    // Basitlik için snapshot her değiştiğinde listeyi update edelim (verimsiz olsa da temiz)
    // Daha verimli: docChanges

    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const data = change.doc.data();
                addPhotoToGrid(change.doc.id, data);

                // Boş mesajını gizle
                const emptyMsg = document.querySelector('.photo-frame-empty');
                if (emptyMsg) emptyMsg.style.display = 'none';
            } else if (change.type === "removed") {
                const card = document.getElementById(`photo-${change.doc.id}`);
                if (card) {
                    gsap.to(card, {
                        scale: 0.5, opacity: 0, duration: 0.5, onComplete: () => {
                            card.remove();
                            // Başka foto yoksa boş mesajını göster
                            if (albumGrid.children.length === 0 || (albumGrid.children.length === 1 && albumGrid.children[0].classList.contains('photo-frame-empty'))) {
                                const emptyMsg = document.querySelector('.photo-frame-empty');
                                if (emptyMsg) emptyMsg.style.display = 'block';
                            }
                        }
                    });
                }
            }
        });
    });
}

function addPhotoToGrid(docId, data) {
    const url = data.url;
    const storagePath = data.storagePath;

    const card = document.createElement('div');
    card.classList.add('photo-card');
    card.id = `photo-${docId}`; // Silme için ID

    // Hafif rastgelelik
    const randomRot = (Math.random() * 6 - 3).toFixed(1);
    card.style.transform = `rotate(${randomRot}deg)`;

    // DELETE BUTTON
    const delBtn = document.createElement('div');
    delBtn.innerHTML = "×";
    delBtn.classList.add('delete-photo-btn');
    delBtn.title = "Fotoğrafı Sil";
    delBtn.onclick = async (e) => {
        e.stopPropagation(); // Kart tıklamasını engelle
        if (!confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) return;

        try {
            // 1. Storage'dan sil (Eğer path varsa)
            if (storagePath && storage) {
                const imageRef = ref(storage, storagePath);
                await deleteObject(imageRef).catch(err => console.warn("Storage silme hatası (önemsiz):", err));
            }

            // 2. Firestore'dan sil
            if (db) {
                await deleteDoc(doc(db, "photos", docId));
            }

        } catch (err) {
            console.error("Silme hatası:", err);
            alert("Silinemedi: " + err.message);
        }
    };


    const img = document.createElement('img');
    img.src = url;
    img.classList.add('photo-img');
    img.loading = "lazy";

    // Belki ileride caption eklenir
    // const caption = document.createElement('div'); ...

    card.appendChild(delBtn);
    card.appendChild(img);

    // Grid'in başına ekle (yeni en başa)
    albumGrid.prepend(card);

    // Giriş animasyonu
    gsap.from(card, {
        duration: 0.8,
        scale: 0.5,
        opacity: 0,
        ease: "back.out(1.7)"
    });
}

// --- ATEŞ BÖCEĞİ (AMBIENT) EFEKTİ ---
function createFireflies() {
    const fireflyCount = 30;

    for (let i = 0; i < fireflyCount; i++) {
        const firefly = document.createElement('div');
        firefly.classList.add('firefly');

        // Rastgele Pozisyon
        const x = Math.random() * 100;
        const y = Math.random() * 100;

        // Rastgele Hareket Yönü (Var)
        const moveX = (Math.random() - 0.5) * 200; // -100px to 100px
        const moveY = (Math.random() - 0.5) * 200;

        // Rastgele Boyut
        const size = Math.random() * 4 + 2; // 2px - 6px

        // Rastgele Süre
        const duration = Math.random() * 10 + 10; // 10s - 20s
        const delay = Math.random() * 10; // 0s - 10s start delay

        firefly.style.left = `${x}vw`;
        firefly.style.top = `${y}vh`;
        firefly.style.width = `${size}px`;
        firefly.style.height = `${size}px`;
        firefly.style.setProperty('--moveX', `${moveX}px`);
        firefly.style.setProperty('--moveY', `${moveY}px`);
        firefly.style.animationName = "firefly-float";
        firefly.style.animationDuration = `${duration}s`;
        firefly.style.animationDelay = `${delay}s`;
        firefly.style.animationIterationCount = "infinite";
        firefly.style.animationTimingFunction = "ease-in-out";

        document.body.appendChild(firefly);
    }
}

// Başlat
createFireflies();

