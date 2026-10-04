const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json({ limit: '10mb' })); // Limit besar agar foto struk bisa lewat

const databaseProduk = [
    { id: 1, nama: "Lanyard", hargaModal: 12000, hargaJual: 17000 },
    { id: 2, nama: "Gelas Custom", hargaModal: 21000, hargaJual: 26000 },
    { id: 3, nama: "Totebag Custom", hargaModal: 30500, hargaJual: 35500 },
    { id: 4, nama: "Stiker Biasa", hargaModal: 4400, hargaJual: 6500 },
    { id: 5, nama: "Stiker Anti Air", hargaModal: 7300, hargaJual: 10500 },
    { id: 6, nama: "Kaos Kaki Putih", hargaModal: 12000, hargaJual: 16000 },
    { id: 7, nama: "Note Book Custom A5", hargaModal: 10500, hargaJual: 15500 },
    { id: 8, nama: "Keychain (Kereta)", hargaModal: 12000, hargaJual: 16000 },
    { id: 9, nama: "Keychain (Logo PNM)", hargaModal: 12000, hargaJual: 16000 }
];

let databasePesanan = [];

app.get('/api/produk-publik', (req, res) => res.json(databaseProduk));

app.post('/api/pesan', (req, res) => {
    const { namaPemesan, wa, catatan, waktu, keranjang, buktiBayar } = req.body;
    
    let totalModal = 0;
    let totalJual = 0;
    let rincianBarang = [];

    keranjang.forEach(item => {
        const produkAsli = databaseProduk.find(p => p.id === item.id);
        if (produkAsli) {
            totalModal += produkAsli.hargaModal * item.qty;
            totalJual += produkAsli.hargaJual * item.qty;
            rincianBarang.push(`${produkAsli.nama} (x${item.qty})`);
        }
    });

    if (totalJual > 0) {
        const teksPesanan = rincianBarang.join(', ');

        const pesananBaru = {
            idTransaksi: databasePesanan.length + 1,
            namaPemesan: namaPemesan,
            wa: wa,
            catatan: catatan,
            namaProduk: teksPesanan,
            hargaModal: totalModal,
            hargaJual: totalJual,
            keuntungan: totalJual - totalModal,
            waktu: waktu,
            buktiBayar: buktiBayar
        };
        databasePesanan.push(pesananBaru);

        // LINK WEBHOOK APPS SCRIPT YANG BARU SUDAH TERPASANG DI SINI
        const urlGoogleSheets = 'https://script.google.com/macros/s/AKfycbzfhC2FvthLNuKVyyisyXUPa4n6RwLuqsirrgYh8Dy_-T1D9-bKeG9ytUqMQm2YPLfXiw/exec'; 

        fetch(urlGoogleSheets, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                waktu: waktu,
                nama: namaPemesan,
                wa: wa,
                pesanan: teksPesanan,
                catatan: catatan || "-",
                totalHarga: totalJual,
                keuntungan: totalJual - totalModal,
                buktiBayar: buktiBayar // Mengirim foto ke Drive
            })
        }).catch(err => console.log("Gagal backup ke Sheets:", err));

        res.json({ status: "Sukses" });
    } else {
        res.status(400).json({ error: "Keranjang kosong" });
    }
});

app.get('/api/riwayat-pesanan', (req, res) => res.json(databasePesanan));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

app.listen(port, () => console.log(`Server siap dijalankan di Port ${port}`));