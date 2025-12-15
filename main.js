import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// --- FIREBASE AYARLARI ---
const firebaseConfig = {
    apiKey: "AIzaSyBmbXkm6bvdR5a0asSfj6wMkcaLqdEG7Ns",
    authDomain: "derapp16-a93c8.firebaseapp.com",
    projectId: "derapp16-a93c8",
    storageBucket: "derapp16-a93c8.firebasestorage.app",
    messagingSenderId: "89998763932",
    appId: "1:89998763932:web:10b0311311d240d7d64a59"
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
        title: "Pilli Bebek - Kızım",
        url: "kizim.mp3"
    },
    {
        title: "Yalın - Küçücüğüm",
        url: "kucucugum.mp3"
    },
    {
        title: "Dedüblüman - Sen Bilmezsin",
        url: "senbilmezsin.mp3"
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
        if (val === 'nostalji') {
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
        <strong>Affına sığınışım</strong>
        Sana uzun uzun dile getirdim ama pişmanlığım bu satırlarda da hayat bulsun istedim.
        Bu parşömenden alan mürekkepte belki daha iyi görürsün utancımı.
        Derin'cim, malum sürecin seni ne kadar üzdüğünün, yorduğunun farkındayım.
        Bunu telafi etmek için, seni tekrar kazanmak için, seni umursamıyor olduğumu bir daha düşünmemen ve o zamanların sana tamamen hayal ürünü gibi gelmesi için elimden geleni yapıyorum, yapacağım da.
        Senden beni anlamanı istemek bile çok küstahça geliyor.
        Hiçbir beklentim yok, sadece çabam var.
        Daha iyi hissetmen için, malum süreci geride bırakmak için, seni ne kadar önemsediğimi tekrardan bilmen ve görmen için çabam var.
        Biliyorum bu çabam er geç karşılık bulur. Bana bu güveni verdiğin için bile sana minnettarım.
        Daha önce ikimiz de sinirliyken sana kullanmak üzere olduğum o "nankör" lafı dibine kadar palavra artık.
        Sen kalbinle, düşüncelerinle, karşındakine verdiğin değerle bir insan harikasısın.
        Başlı başına bir güzellik abidesisin. Umarım çokça uğraştığım ve sabahın 5ine kadar göz kırpmadan üzerine çalıştığım bu sayfa, bu minik hediye beni affetmen için güzel bir adım olur.
        Herşey seni ne kadar sevdiğimi bilmen, kendini iyi ve özel hissetmen için.
        Özrüme vereceğin karşılığı sitenin sağ altında bulunan tüylü kalem ikonundan mektup yazarak bana bırakabilirsin.
        "Mühürle" butonuna bastığın anda mektubun zarfa yerleşip sitenin aşağı kısmında hayat bulacak.
        Ben de kısa bir süre sonra buraya gelip bana yazdığın mektubu okuyor olacağım.
        Sen her şeyden daha değerlisin, her şeyden daha önemlisin.
        Bütün utancım, üzgünlüğüm ve çekingenliğimle senden tekrardan özür diliyorum.
        Beni affet, sen benim hayatımda nadide bir çiçeksin.
        Beni affet ki çiçeğim yeniden bana açsın, düşen boynu yeniden dikleşsin.
        Benim yüzüm tekrardan gülsün. Senin gülüşün dünyadaki en güzel manzarayken o gülüşü doldurmak, kendime yapabileceğim en büyük kötülüktü. 
        ~ Bütün utancıyla , pişmanlığıyla ve sevgisiyle merhametine sığınan Erdem.
    `,

    letter2: `
        <strong>Benim minik Derin'im, biriciğim, birtanem, güzelim...</strong>
        Sana bu hitaplarla seslendiğim için umarım bana kızmazsın. Umarım bu cüretkarlığımı hoş görür ve birazdan göreceklerinin hatrına bu cesaretimi bağışlarsın.
        Biriciğim benim, sen bu dünyada benzeri olmayan bir güzelliksin. Sen bu dünyada dahası olmayan bir karaktersin. Sen bu dünyada hiçbir çaba ile elde edilemeyecek kadar yüce birşeysin. Ne mutlu bana, ne mutlu bana ki sahip olduğum bu küçücük dünyamdaki en sıradan özelliğim olan efendiliğimle seni kendime yar ettim. 
        Minik Derin'im benim, senle ilk buluşmamızdaki o çocuksu heyecanın, utancın dün gibi aklımda. O minicik ellerini ilk tutuşum ve senin gerçekten bir bebek olduğunu anladığım ilk an dün gibi aklımda. Bir yaş daha alıyorsun bugün itibariyle. Ama sen benim gözümde hep aynı bebeksin, ağzında emziği çipil gözler ve dolgun yanaklarla masum masum bakan minik bebek. Sen şu zalim dünyada sahip olabileceğim, gözlerinin içine bakıp mutluluğuyla mutlu olabileceğim en güzel şeysin.
        Seninle geçen her anım hayattaki en mutlu zamanlarımdı, hiçbir şey yapmadan dip dibe oturduğumuz zamanlar bile , yalnızca benim olmanın ve yanımda olmanın mutluluğunu yaşıyordum içimde. Öylesine güzelsin, öylesine iyisin, öylesine benimsin, öylesine içimdesin. 
        Yalnızca varlığı bile mutluluğum için yeterli olan ender şeylerdensin. İyi ki varsın biriciğim benim.
        Bu mektuba ismini veren bugün, takvim yapraklarının en anlamlı günü. 16 Aralık sadece bir tarih olmaktan öte benim için bir milat, bunu bilmelisin. Benim için birçok şeyin başlangıcı, en güzel zamanlarımın hazırlanışı, hayatıma anlam katacak olayların ilk adımı. 16 Aralıklar çok özel , 16 Aralık 2008 hepsinden daha özel. Kutlu gün, bir bebeğin (biricik bebeğimin) gözünü dünyaya açtığı gün. Keşke iyi bir şair olsaydım da varoluşuna şiirler yazabilseydim. Keşke bir müzisyen olsaydım da çipil gözlerine şarkılar yazabilseydim. Keşke bir ressam olsaydım da o mucizevi güzelliğini naçizane yeteneğimle resmedebilseydim. Ama biliyorum hiçbir şairin kalemi dayanmaz seni yazmaya , hiçbir şarkıcının mikrofonu yetmez seni anlatmaya , hiçbir ressamın boyaları dolduramaz tuvali güzelliğinle. Ne şairlik ne şarkıcılık ne de ressamlık var kanımda, eli klavyesinde bir yazılımcı olarak şuan senin için yapabileceğim en güzel şey okuduğun bu satırları daha güzel bir yerde sana sunmaktı. Elimden geleni yaptım. Umarım mutlu olmuşsundur, bunları okurken mutlu olma ihtimalin bile beni şimdiden mutlu etmeye başladı. Sen hep mutlu ol, sen hep huzurlu ol, sen hep böyle iyi ve güzel ol. Ben canını sıkacak durumları önünden kaldırmak için elimden geleni hep yapmaya çalışıyor olacağım. Umarım senin için her 16 Aralık bir öncekinden çok daha mutlu geçer. İleride konuşmuyor olsak bile kendi köşemde bir yerlerde içten içe bu kutlu günü kutluyor olacağım. Kim bilir belki sana hiç ulaşmayacak mektuplar yazıyor, belki de senin şerefine şarkılar söylüyor olacağım. O zaman öyle umut ederim ki kuşlar gelir de kulağına sesimi taklit eder ve bugünü hatırlatır. 
        İyi ki doğdun, iyi ki varsın benim güzel Derin'im. İyi ki bu dünyadasın, iyi ki bu ülkedesin, iyi ki hiç beklemediğimiz o zamanda tahmin edilemez bir yerde rastlaştık. Milyonlarca ihtimal içinden bizi denk getiren Allah'a şükürler olsun. İyi ki dayanamayıp numaranı dolaylı yoldan istedim. Senle ilgili her şey iyi ki. İyi ki sen, iyi ki seninle. 
        Varlığınla dünyayı güzelleştiriyorsun biriciğim ♥️
        En yakın zamanda hediyelerini sana yüz yüze vermek dileğiyle..
        ~ Erdemomin
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

// --- ZARF TIKLAMA ---
const birthdayModal = document.getElementById('birthday-modal');
const confettiContainer = document.getElementById('confetti-container');

function createConfetti() {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];

    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');

        // Rastgele Özellikler
        const bg = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const animDuration = Math.random() * 3 + 2;
        const size = Math.random() * 10 + 5;

        confetti.style.backgroundColor = bg;
        confetti.style.left = `${left}%`;
        confetti.style.animationDuration = `${animDuration}s`;
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        confetti.style.opacity = Math.random();

        confettiContainer.appendChild(confetti);

        // Temizlik
        setTimeout(() => {
            confetti.remove();
        }, animDuration * 1000);
    }
}

// --- ZARF TIKLAMA ---
envelopes.forEach(env => {
    env.addEventListener('click', function () {
        const letterType = this.getAttribute('data-letter');

        // DOĞUM GÜNÜ SÜRPRİZİ KONTROLÜ (Sadece 16 Aralık mektubunda ve ilk tıklamada)
        if (letterType === 'letter2') {
            try {
                // sessionStorage erişimini güvenli hale getir
                let hasSeenBirthday = false;
                try {
                    hasSeenBirthday = sessionStorage.getItem('hasSeenBirthday_v3');
                } catch (storeErr) {
                    console.warn("Storage erişim hatası:", storeErr);
                }

                if (!hasSeenBirthday) {
                    // Sürprizi Başlat
                    triggerNewBirthdaySurprise(() => {
                        // Bitişte yapılacaklar
                        try {
                            sessionStorage.setItem('hasSeenBirthday_v3', 'true');
                        } catch (e) { }

                        // Mektubu aç
                        currentActiveLetter = letterContent[letterType];
                        const rect = this.getBoundingClientRect();
                        openReadingMode(rect, currentActiveLetter);
                    });

                    return; // Standart akışı durdur
                }
            } catch (err) {
                console.error("Birthday logic error:", err);
                // Hata olursa devam et, mektubu aç
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

// 3. Dosya Seçilince Yükle
photoUploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!storage) {
        alert("Fotoğraf yükleyebilmek için Firebase Storage etkinleştirilmelidir.");
        return;
    }

    try {
        uploadTriggerBtn.innerText = "Yükleniyor...";
        uploadTriggerBtn.classList.add('loading');

        // Dosya adı uniq olsun
        const uniqueName = "photo_" + Date.now() + "_" + file.name;
        const storageRef = ref(storage, 'photos/' + uniqueName);

        // Yükle
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);

        // Firestore'a kaydet
        await addDoc(collection(db, "photos"), {
            url: downloadUrl,
            storagePath: 'photos/' + uniqueName,
            createdAt: serverTimestamp()
        });

        alert("Fotoğraf başarıyla eklendi!");

    } catch (err) {
        console.error("Yükleme hatası:", err);
        alert("Bir hata oluştu: " + err.message);
    } finally {
        uploadTriggerBtn.innerText = "Fotoğraf Ekle +";
        uploadTriggerBtn.classList.remove('loading');
        photoUploadInput.value = ""; // Reset
    }
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

// --- YENİ KUTLAMA MANTIĞI ---

const heartsContainer = document.getElementById('hearts-container');
const candlesContainer = document.getElementById('candles-container');
const countdownDisplay = document.getElementById('countdown-display');
const finalMessage = document.getElementById('final-message');

function createContinuousConfetti(durationSeconds) {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];

    // Her 100ms'de bir konfeti üret
    const interval = setInterval(() => {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti-item');

        const bg = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const animDuration = Math.random() * 3 + 3; // 3-6s düşüş
        const size = Math.random() * 10 + 5;

        confetti.style.backgroundColor = bg;
        confetti.style.left = `${left}%`;
        confetti.style.animationDuration = `${animDuration}s`;
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;

        confettiContainer.appendChild(confetti);

        setTimeout(() => confetti.remove(), animDuration * 1000);
    }, 100);

    // Süre bitince durdur
    setTimeout(() => {
        clearInterval(interval);
    }, durationSeconds * 1000);
}

function createHearts(durationSeconds) {
    const interval = setInterval(() => {
        const heart = document.createElement('div');
        heart.classList.add('heart-shape');

        const left = Math.random() * 100;
        const animDuration = Math.random() * 4 + 4; // 4-8s yükseliş
        const scale = Math.random() * 1 + 0.5; // 0.5 - 1.5 boyut

        heart.style.left = `${left}%`;
        heart.style.animation = `floatUp ${animDuration}s linear forwards`;
        heart.style.transform = `scale(${scale}) rotate(45deg)`;

        heartsContainer.appendChild(heart);

        setTimeout(() => heart.remove(), animDuration * 1000);
    }, 50); // HIZLANDIRILDI: Her 50ms'de bir kalp

    setTimeout(() => {
        clearInterval(interval);
    }, durationSeconds * 1000);
}

function createBackgroundCandles() {
    candlesContainer.innerHTML = "";
    const count = 15; // 15 mum

    for (let i = 0; i < count; i++) {
        const candle = document.createElement('div');
        candle.classList.add('bg-candle');

        const h = Math.random() * 60 + 40; // KISA MUMLAR: 40-100px (Metne değmez)
        const l = Math.random() * 100;
        const b = Math.random() * 5; // DİBE YAKIN: 0-5% arası

        candle.style.height = `${h}px`;
        candle.style.left = `${l}%`;
        candle.style.bottom = `${b}%`;

        const flame = document.createElement('div');
        flame.classList.add('bg-flame');

        candle.appendChild(flame);
        candlesContainer.appendChild(candle);

        // Rastgele animasyon gecikmesi
        flame.style.animationDelay = `${Math.random()}s`;

        // Giriş animasyonu
        gsap.from(candle, {
            duration: 2,
            opacity: 0,
            y: 50,
            delay: Math.random() * 1,
            ease: "power2.out"
        });
    }
}

// YENİ TETİKLEME MANTIĞI
function triggerNewBirthdaySurprise(callback) {
    // 1. Ekranı Karart (Modal Active)
    birthdayModal.classList.add('active');

    const tl = gsap.timeline();

    // 2. Geri Sayım
    countdownDisplay.style.opacity = 1;

    ["3", "2", "1"].forEach((num, index) => {
        tl.to(countdownDisplay, {
            duration: 0.1,
            opacity: 1,
            scale: 0.5,
            innerHTML: num,
            onStart: () => { countdownDisplay.innerHTML = num; }
        })
            .to(countdownDisplay, {
                duration: 0.9,
                scale: 1.2,
                opacity: 0,
                ease: "power2.out"
            });
    });

    // 3. Büyük Yazı ve Mumlar
    tl.call(() => {
        createBackgroundCandles();
        createContinuousConfetti(10); // 10 saniye
        createHearts(10); // 10 saniye

        gsap.to(finalMessage, {
            duration: 2,
            opacity: 1,
            scale: 1,
            ease: "elastic.out(1, 0.3)"
        });
    });

    // 4. 10 Saniye Sonra Bitiş
    tl.to({}, { duration: 10 }); // Bekle

    tl.to([birthdayModal, finalMessage], {
        duration: 1.5,
        opacity: 0,
        onComplete: () => {
            birthdayModal.classList.remove('active');
            callback();

            // Temizlik
            candlesContainer.innerHTML = "";
        }
    });
}
