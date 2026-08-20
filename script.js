const CONFIG = {

    GOOGLE_DOC_URL: "https://docs.google.com/document/d/1ocqOshoM_F2iB-wK15PnOX4AR7hT46rAQSodpFdyRDQ/edit?usp=sharing",
    MODEL_URL: "https://teachablemachine.withgoogle.com/models/o1O2n5q_s/",
    SPREADSHEET_API_URL: "https://script.google.com/macros/s/AKfycbywgIvubGi5AsZZyov_mW7cqHAjnlwHBWchDYz72o6cf_RFvh-syf6h0jhU0V2NiT_4/exec",

    MIN_CONFIDENCE: 0.85
};

let model = null;
let uploadedImage = null;

document.addEventListener("DOMContentLoaded", () => {

    const menuToggle = document.querySelector(".hamburg");
    const dropdown = document.querySelector(".dropdown");
    const dropdownCancel = document.querySelector(".dropdown .cancel");

    if (menuToggle && dropdown) {
        menuToggle.addEventListener("click", () => {
            dropdown.classList.toggle("open");
            menuToggle.setAttribute(
                "aria-expanded",
                dropdown.classList.contains("open")
            );
        });

        if (dropdownCancel) {
            dropdownCancel.addEventListener("click", () => {
                dropdown.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        }

        document.querySelectorAll(".dropdown-links a").forEach(link => {
            link.addEventListener("click", () => {
                dropdown.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", function (event) {

            const targetId = this.getAttribute("href");
            if (!targetId || targetId === "#") return;

            const target = document.querySelector(targetId);
            if (target) {
                event.preventDefault();
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });

    });


    const imageInput = document.getElementById("imageInput");
    const previewWrap = document.getElementById("previewWrap");
    const imagePreview = document.getElementById("imagePreview");
    const analyzeButton = document.getElementById("analyzeButton");
    const statusMessage = document.getElementById("statusMessage");

    if (imageInput) {
    imageInput.addEventListener("change", function () {

        const file = this.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Silakan pilih file gambar.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert("Ukuran gambar maksimal 10 MB.");
            return;
        }
        
        uploadedImage = file;

        const reader = new FileReader();

        reader.onload = function (event) {

            imagePreview.src = event.target.result;
            previewWrap.classList.add("show");
            analyzeButton.disabled = false;
            statusMessage.textContent =
                "Foto siap dianalisis.";
        };

        reader.readAsDataURL(file);
    });
}

    const uploadArea = document.querySelector(".upload-card");

    if (uploadArea) {
        uploadArea.addEventListener("dragover", event => {
            event.preventDefault();
            uploadArea.classList.add("dragging");
        });

        uploadArea.addEventListener("dragleave", () => {
            uploadArea.classList.remove("dragging");
        });

        uploadArea.addEventListener("drop", event => {
            event.preventDefault();
            uploadArea.classList.remove("dragging");

            const file = event.dataTransfer.files[0];

            if (!file) return;

            if (!file.type.startsWith("image/")) {
                alert("File yang dipilih bukan gambar.");
                return;
            }

            uploadedImage = file;

            const reader = new FileReader();

            reader.onload = function (event) {

                if (imagePreview) {
                    imagePreview.src = event.target.result;
                }

                if (previewWrap) {
                    previewWrap.classList.add("show");
                }

                if (analyzeButton) {
                    analyzeButton.disabled = false;
                }

                if (statusMessage) {
                    statusMessage.textContent = "Foto siap dianalisis.";
                }
            };

            reader.readAsDataURL(file);
        });
    }

    if (analyzeButton) {

        analyzeButton.addEventListener("click", async () => {

            if (!uploadedImage) {
                alert("Silakan upload foto daun padi terlebih dahulu.");
                return;
            }

            await analyzeImage();
        });
    }

    const resetButton = document.getElementById("resetButton");

    if (resetButton) {
        resetButton.addEventListener("click", () => {
            uploadedImage = null;

            if (imageInput) {
                imageInput.value = "";
            }

            if (imagePreview) {
                imagePreview.src = "";
            }

            if (previewWrap) {
                previewWrap.classList.remove("show");
            }

            if (analyzeButton) {
                analyzeButton.disabled = true;
            }
        });
    }

    const backToTop = document.getElementById("scrollTop");

    if (backToTop) {
        window.addEventListener("scroll", () => {

            if (window.scrollY > 400) {
                backToTop.classList.add("show");
            } else {
                backToTop.classList.remove("show");
            }

        });

        backToTop.addEventListener("click", () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        });
    }

});

async function loadModel() {

    if (
        !CONFIG.MODEL_URL ||
        CONFIG.MODEL_URL.trim() === ""
    ) {
        throw new Error(
            "URL model Teachable Machine belum dimasukkan."
        );
    }

    const baseURL =
        CONFIG.MODEL_URL.endsWith("/")
            ? CONFIG.MODEL_URL
            : CONFIG.MODEL_URL + "/";

    const modelURL =
        baseURL + "model.json";

    const metadataURL =
        baseURL + "metadata.json";

    console.log(
        "Model URL:",
        modelURL
    );

    console.log(
        "Metadata URL:",
        metadataURL
    );

    model = await tmImage.load(
        modelURL,
        metadataURL
    );

    console.log(
        "Model berhasil dimuat!"
    );

    return model;
}

async function analyzeImage() {

    const analyzeButton =
        document.getElementById("analyzeButton");

    const statusMessage =
        document.getElementById("statusMessage");

    try {
        console.log("=== ANALISIS DIMULAI ===");
        if (!uploadedImage) {
            alert("Silakan pilih gambar terlebih dahulu.");
            return;
        }

        analyzeButton.disabled = true;
        analyzeButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Menganalisis...';

        statusMessage.textContent =
            "Memuat model AI...";

        if (!model) {
            console.log("Model belum dimuat. Memuat sekarang...");
            await loadModel();
            console.log("Model berhasil dimuat.");
        }

        statusMessage.textContent =
            "Model berhasil dimuat. Menganalisis gambar...";

        const image = new Image();

        const imageURL =
            URL.createObjectURL(uploadedImage);

        image.src = imageURL;

        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = () => {
                reject(
                    new Error("Gambar gagal dimuat.")
                );
            };

        });

        console.log("Menjalankan prediksi...");

        const predictions =
            await model.predict(image);

        console.log(
            "Hasil prediksi:",
            predictions
        );

        const bestPrediction =
            predictions.reduce(
                (best, current) => {

                    return current.probability >
                        best.probability
                        ? current
                        : best;

                }
            );

        const className =
            bestPrediction.className;

        const confidence =
            bestPrediction.probability;

        console.log(
            "Class:",
            className
        );

        console.log(
            "Confidence:",
            confidence
        );

        URL.revokeObjectURL(imageURL);

        updateConfidence(confidence);

        if (
            confidence <
            CONFIG.MIN_CONFIDENCE
        ) {

            showLowConfidenceResult(
                confidence
            );

            statusMessage.textContent =
                "Confidence AI terlalu rendah.";

            return;
        }

        statusMessage.textContent =
            "Mengambil informasi diagnosis...";

        console.log(
            "Mencari data:",
            className
        );

        const diagnosisData =
            await getDiagnosisFromSpreadsheet(
                className
            );

        displayResult(
            className,
            confidence,
            diagnosisData
        );

        statusMessage.textContent =
            "Analisis selesai!";

        console.log(
            "=== ANALISIS SELESAI ==="
        );

    } catch (error) {

        console.error(
            "=== ERROR ANALISIS ==="
        );

        console.error(error);

        statusMessage.textContent =
            "Terjadi kesalahan saat analisis.";

        alert(
            "Analisis gagal.\n\n" +
            error.message
        );

    } finally {

        analyzeButton.disabled = false;

        analyzeButton.innerHTML =
            '<i class="fa-solid fa-wand-magic-sparkles"></i> Analisis Foto';

    }
}

function updateConfidence(confidence) {

    const percentage =
        Math.round(confidence * 100);

    const confidenceBar =
        document.getElementById("confidenceBar");

    const confidenceText =
        document.getElementById("confidenceText");

    if (confidenceBar) {

        confidenceBar.style.width =
            percentage + "%";
    }

    if (confidenceText) {

        confidenceText.textContent =
            percentage + "%";
    }
}

function showLowConfidenceResult(confidence) {

    const diagnosis =
        document.getElementById("diagnosisName");

    const category =
        document.getElementById("resultCategory");

    const cause =
        document.getElementById("resultCause");

    const symptoms =
        document.getElementById("resultSymptoms");

    const solution =
        document.getElementById("resultSolution");


    if (diagnosis) {
        diagnosis.textContent =
            "Belum dapat ditentukan";
    }

    if (category) {
        category.textContent =
            "Confidence rendah";
    }

    if (cause) {
        cause.textContent =
            "Model AI belum cukup yakin terhadap kondisi daun.";
    }

    if (symptoms) {
        symptoms.textContent =
            "Gunakan foto daun yang lebih jelas dan memiliki pencahayaan yang cukup.";
    }

    if (solution) {
        solution.textContent =
            "Ambil foto ulang dengan posisi daun terlihat jelas dan fokus.";
    }

    updateConfidence(confidence);
}


async function getDiagnosisFromSpreadsheet(className) {

    if (
        !CONFIG.SPREADSHEET_API_URL ||
        CONFIG.SPREADSHEET_API_URL.trim() === "" ||
        CONFIG.SPREADSHEET_API_URL.includes("XXXXXXXX")
    ) {

        console.warn(
            "URL Google Apps Script belum diatur."
        );

        return {
            diagnosis: className,
            category: "Belum terhubung ke database",
            cause: "Data penyebab belum tersedia.",
            symptoms: "Data gejala belum tersedia.",
            solution: "Data solusi belum tersedia."
        };
    }

    try {

        const url =
            CONFIG.SPREADSHEET_API_URL +
            "?diagnosis=" +
            encodeURIComponent(className);

        const response =
            await fetch(url);

        if (!response.ok) {
            throw new Error(
                "Gagal mengambil data dari Google Apps Script."
            );
        }

        const data =
            await response.json();

        console.log(
            "Data mentah dari spreadsheet:",
            data
        );

        return normalizeSpreadsheetData(
            data,
            className
        );

    } catch (error) {

        console.error(
            "Database error:",
            error
        );

        return {
            diagnosis: className,
            category: "Database tidak dapat diakses",
            cause: "Data belum berhasil diambil dari Spreadsheet.",
            symptoms: "Silakan coba lagi beberapa saat.",
            solution: "Pastikan koneksi Google Apps Script sudah benar."
        };
    }
}

function normalizeSpreadsheetData(data, fallbackName) {

    const row =
        Array.isArray(data)
            ? data[0]
            : data;

    if (!row) {

        return {
            diagnosis: fallbackName,
            category: "Data tidak ditemukan",
            cause: "Tidak ada data diagnosis yang cocok.",
            symptoms: "Data gejala belum tersedia.",
            solution: "Silakan periksa kembali hasil prediksi AI."
        };
    }

    function findColumnValue(keywords) {

        for (const key of Object.keys(row)) {

            const normalizedKey =
                key.trim().toLowerCase();

            const matches =
                keywords.some(keyword =>
                    normalizedKey.includes(keyword)
                );

            if (matches) {
                const value = row[key];
                if (
                    value !== undefined &&
                    value !== null &&
                    String(value).trim() !== ""
                ) {
                    return String(value).trim();
                }
            }
        }
        return null;
    }
    return {
        diagnosis:
            findColumnValue(["diagnosis", "nama penyakit", "nama"]) ||
            fallbackName,

        category:
            findColumnValue(["kategori", "category"]) ||
            "Tidak tersedia",

        cause:
            findColumnValue(["penyebab", "sebab", "cause"]) ||
            "Tidak tersedia",

        symptoms:
            findColumnValue(["gejala", "symptom", "tanda", "ciri"]) ||
            "Tidak tersedia",

        solution:
            findColumnValue(["solusi", "solution", "penanganan", "cara mengatasi"]) ||
            "Tidak tersedia"
    };
}

function displayResult(
    className,
    confidence,
    data
) {

    const diagnosis =
        document.getElementById("diagnosisName");

    const category =
        document.getElementById("resultCategory");

    const cause =
        document.getElementById("resultCause");

    const symptoms =
        document.getElementById("resultSymptoms");

    const solution =
        document.getElementById("resultSolution");


    if (diagnosis) {
        diagnosis.textContent =
            data.diagnosis || className;
    }

    if (category) {
        category.textContent =
            data.category || "-";
    }

    if (cause) {
        cause.textContent =
            data.cause || "-";
    }

    if (symptoms) {
        symptoms.textContent =
            data.symptoms || "-";
    }

    if (solution) {
        solution.textContent =
            data.solution || "-";
    }

    updateConfidence(confidence);

    console.log(
        "HASIL AKHIR:",
        data
    );
}


window.addEventListener("scroll", () => {

    const sections =
        document.querySelectorAll("section[id]");

    const navItems =
        document.querySelectorAll(".desktop-links a, .dropdown-links a");

    let currentSection = "";

    sections.forEach(section => {

        const sectionTop =
            section.offsetTop - 150;

        const sectionHeight =
            section.offsetHeight;

        if (
            window.scrollY >= sectionTop &&
            window.scrollY <
                sectionTop + sectionHeight
        ) {

            currentSection =
                section.getAttribute("id");
        }

    });

    navItems.forEach(item => {

        item.classList.remove("active");

        const href =
            item.getAttribute("href");

        if (href === "#" + currentSection) {
            item.classList.add("active");
        }

    });

});


function validateImage(file) {

    if (!file) {
        return false;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

        alert(
            "Format gambar harus JPG, PNG, atau WEBP."
        );

        return false;
    }

    if (file.size > 10 * 1024 * 1024) {

        alert(
            "Ukuran gambar maksimal 10 MB."
        );

        return false;
    }

    return true;
}

function capitalizeText(text) {

    if (!text) return "";

    return text
        .toLowerCase()
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );
}
