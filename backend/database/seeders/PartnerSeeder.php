<?php

namespace Database\Seeders;

use App\Models\Partner;
use Illuminate\Database\Seeder;

class PartnerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            'CV BETA FOAM INDUSTRIAL',
            'CV GLOBALINDO PERKASA ENGINERING',
            'KK-Brothers',
            'PT A&P INDUSTRY INDONESIA',
            'PT ANEKA KOMKAR UTAMA',
            'PT APM Hyundai Transys',
            'PT ARGATAMA MULTI AGUNG',
            'PT ASAHI SANGYO INDONESIA',
            'PT ATMI SOLO',
            'PT BROCO AERATED CONCRETE INDUSTRY',
            'PT CAKRAWALA',
            'PT Cahaya Global Infinity Pratama',
            'PT Caturindo Agungjaya Rubber',
            'PT Chiyoda Industri',
            'PT CIPTAJAYA KREASINDO UTAMA',
            'PT CITRA GALVALINDO',
            'PT CITRA SEHATI MANDIRI',
            'PT DASA WINDU AGUNG',
            'PT DAYA PRESINDO UTAMA',
            'PT DEWA PUTRA MANUFACTURING',
            'PT DHARMA POLIPLAST',
            'PT Duta Rantai Mas',
            'PT.EPW BAJA LESTARI',
            'PT ERAN TEKNIKATAMA',
            'PT Fress Motorindo',
            'PT FUJI SEAT INDONESIA',
            'PT Fukoku Tokai Rubber Indonesia',
            'PT Fukuda',
            'PT Gerindo Jaya',
            'PT HUTOMO BERKAH RIDHO',
            'PT IEC Indonesia',
            'PT INDOTAMA BALADEWA KURNIA',
            'PT INDTA PRATAMAJAYA',
            'PT INGRESS MALINDO VENTURES',
            'PT INOMEC JAYA',
            'PT Inovasi Teknologi Engineering',
            'PT INTI KARYA',
            'PT INTRA PRESISI INDONESIA',
            'PT IRC INOAC INDONESIA',
            'PT KAWASHIMA ENGINEERING PLASTIC INDONESIA',
            'PT KBC INTERNATIONAL',
            'PT KMIL',
            'PT Laksana',
            'PT MADA WIKRI TUNGGAL',
            'PT MATRA RODA PIRANTI',
            'PT MEKAR INDO BERKAH',
            'PT MENARA TERUS MAKMUR',
            'PT Menara Unggul Sejahtera',
            'PT METINDO ERA SAKTI',
            'PT MIRINDA CIPTA PLASTISINDO',
            'PT MITRAMETAL PERKASA',
            'PT Moreen Indonesia',
            'PT NAGA MAS INTIPRATAMA',
            'PT NANDYA KARYA PERKASA',
            'PT NITIGURA INDONESIA',
            'PT NOBI',
            'PT PACIFIC RUBBER WORKS',
            'PT PADMA SOODE INDONESIA',
            'PT PANASONIC MANUFACTURING INDONESIA (FAN)',
            'PT Pandawa Manunggal Jaya',
            'PT PREFAB CIPTA LAKSANA',
            'PT REKADAYA MULTI ADIPRIMA',
            'PT SAKURA MOTORINDO',
            'PT SARANA UNGGUL PRATAMA',
            'PT SIIX EMS INDONESIA',
            'PT SINAR KENCANA SEJATI',
            'PT Surya Gesima Sejahtera',
            'PT TANAJAWA MASAGI INDONESIA',
            'PT TOYOTA BOSHOKU INDONESIA',
            'PT Tri Centrum Fortuna',
            'PT TRIM RUBBER',
            'PT TRIMAS EKATAMA NUSANTARA',
            'PT TRISAUDARA SENTOSA INDUSTRI',
            'PT USRA TAMPI INDONESIA',
            'PT Velasto Indonesia',
            'PT Welindo Mathotech Sukses',
            'PT Yogya Presisi Tehnikatama Industri',
            'PT YUTAKA MANUFACTURING INDONESIA',
        ];

        $poSuppliers = [
            'CV Sansei Engineering',
            'CV Three Jaya',
            'PT Astra Daido',
            'PT Fujimaki',
            'PT Misumi',
            'PT Precision Special Steel',
            'PT Rukun Sejahtera Teknik',
        ];

        $scSuppliers = [
            'CHIYODA',
            'GEMA',
            'IDM COATING',
            'KANETSU',
            'NCI',
            'OERLICON',
            'PRO-TECH',
            'PUTRA',
        ];

        foreach ($customers as $name) {
            Partner::firstOrCreate(
                ['name' => $name, 'type' => 'customer'],
                ['status' => 'active']
            );
        }

        foreach ($poSuppliers as $name) {
            Partner::firstOrCreate(
                ['name' => $name, 'type' => 'supplier_po'],
                ['status' => 'active']
            );
        }

        foreach ($scSuppliers as $name) {
            Partner::firstOrCreate(
                ['name' => $name, 'type' => 'supplier_subcont'],
                ['status' => 'active']
            );
        }
    }
}
