<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Contrat de Location #{{ str_pad($rental->id, 6, '0', STR_PAD_LEFT) }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }

        .header { background: #1e40af; color: #fff; padding: 20px 28px; margin-bottom: 20px; }
        .header-title { font-size: 20px; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px; }
        .header-sub { font-size: 10px; opacity: 0.8; }

        .section { margin: 0 28px 18px; }
        .section-title {
            font-size: 10px; font-weight: bold; color: #1e40af;
            border-bottom: 1.5px solid #1e40af; padding-bottom: 4px;
            margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;
        }

        table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 5px 6px; vertical-align: top; }
        .label { color: #6b7280; font-size: 9px; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 2px; }
        .value { font-size: 11px; color: #111827; }

        .amount-table th {
            background: #f3f4f6; padding: 6px 8px; text-align: left;
            font-size: 9px; text-transform: uppercase; color: #374151;
            border: 1px solid #e5e7eb;
        }
        .amount-table td { padding: 6px 8px; border: 1px solid #e5e7eb; font-size: 11px; }
        .amount-table .total-row { background: #eff6ff; font-weight: bold; color: #1e40af; }

        .badge { display: inline; padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: bold; }
        .badge-ongoing   { background: #dbeafe; color: #1d4ed8; }
        .badge-completed { background: #dcfce7; color: #15803d; }
        .badge-cancelled { background: #fee2e2; color: #b91c1c; }

        .notes-box {
            padding: 8px 10px; background: #f9fafb;
            border: 1px solid #e5e7eb; border-radius: 4px; font-size: 10px; color: #374151;
        }

        .signature-row { display: flex; gap: 20px; }
        .signature-block { flex: 1; }
        .signature-line { border: 1px solid #d1d5db; height: 70px; border-radius: 4px; margin-top: 6px; }
        .signature-label { text-align: center; font-size: 9px; color: #6b7280; margin-top: 4px; }

        .footer {
            margin: 24px 28px 0;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
            font-size: 9px; color: #9ca3af;
        }
        .footer-inner { display: flex; justify-content: space-between; }

        .divider { border: none; border-top: 1px solid #f3f4f6; margin: 0 28px 18px; }
    </style>
</head>
<body>

    {{-- ═══ EN-TÊTE ═══ --}}
    <div class="header">
        <div class="header-title">CONTRAT DE LOCATION</div>
        <div class="header-sub">
            {{ $rental->company->name ?? 'FleetRental' }}
            &nbsp;·&nbsp;
            Réf. n° {{ str_pad($rental->id, 6, '0', STR_PAD_LEFT) }}
            &nbsp;·&nbsp;
            Établi le {{ $rental->created_at->format('d/m/Y') }}
        </div>
    </div>

    {{-- ═══ INFORMATIONS DU CONTRAT ═══ --}}
    <div class="section">
        <div class="section-title">Informations du contrat</div>
        <table class="info-table">
            <tr>
                <td width="33%">
                    <span class="label">Référence</span>
                    <span class="value">#{{ str_pad($rental->id, 6, '0', STR_PAD_LEFT) }}</span>
                </td>
                <td width="33%">
                    <span class="label">Date de création</span>
                    <span class="value">{{ $rental->created_at->format('d/m/Y à H:i') }}</span>
                </td>
                <td width="34%">
                    <span class="label">Statut</span>
                    <span class="value">
                        <span class="badge badge-{{ $rental->status }}">
                            @if($rental->status === 'ongoing')   En cours
                            @elseif($rental->status === 'completed') Terminée
                            @else Annulée
                            @endif
                        </span>
                    </span>
                </td>
            </tr>
        </table>
    </div>

    <hr class="divider">

    {{-- ═══ CLIENT ═══ --}}
    <div class="section">
        <div class="section-title">Informations du locataire</div>
        <table class="info-table">
            <tr>
                <td width="33%">
                    <span class="label">Nom complet</span>
                    <span class="value">{{ $rental->customer_name }}</span>
                </td>
                <td width="33%">
                    <span class="label">Téléphone</span>
                    <span class="value">{{ $rental->customer_phone }}</span>
                </td>
                <td width="34%">
                    <span class="label">Email</span>
                    <span class="value">{{ $rental->customer_email ?: '—' }}</span>
                </td>
            </tr>
            <tr>
                <td width="33%">
                    <span class="label">CIN / Passeport</span>
                    <span class="value">{{ $rental->customer_id_card ?: '—' }}</span>
                </td>
                <td width="67%" colspan="2">
                    <span class="label">Adresse</span>
                    <span class="value">{{ $rental->customer_address ?: '—' }}</span>
                </td>
            </tr>
        </table>
    </div>

    <hr class="divider">

    {{-- ═══ VÉHICULE ═══ --}}
    <div class="section">
        <div class="section-title">Véhicule loué</div>
        <table class="info-table">
            <tr>
                <td width="40%">
                    <span class="label">Véhicule</span>
                    <span class="value">
                        {{ $rental->vehicle->brand ?? '' }}
                        {{ $rental->vehicle->model ?? '' }}
                        {{ $rental->vehicle->year ?? '' }}
                    </span>
                </td>
                <td width="30%">
                    <span class="label">Immatriculation</span>
                    <span class="value">{{ $rental->vehicle->registration_number ?? '—' }}</span>
                </td>
                <td width="30%">
                    <span class="label">Kilométrage départ</span>
                    <span class="value">{{ number_format($rental->start_mileage, 0, ',', ' ') }} km</span>
                </td>
            </tr>
            @if($rental->end_mileage)
            <tr>
                <td width="40%">
                    <span class="label">Kilométrage retour</span>
                    <span class="value">{{ number_format($rental->end_mileage, 0, ',', ' ') }} km</span>
                </td>
                <td width="60%" colspan="2">
                    <span class="label">Distance parcourue</span>
                    <span class="value">{{ number_format($rental->end_mileage - $rental->start_mileage, 0, ',', ' ') }} km</span>
                </td>
            </tr>
            @endif
        </table>
    </div>

    <hr class="divider">

    {{-- ═══ PÉRIODE & TARIFICATION ═══ --}}
    <div class="section">
        <div class="section-title">Période & Tarification</div>

        @php
            $start = \Carbon\Carbon::parse($rental->start_date);
            $end   = \Carbon\Carbon::parse($rental->end_date);
            $days  = $start->diffInDays($end) + 1;
            $remaining = max(0, $rental->total_price - $rental->paid_amount);
        @endphp

        <table class="amount-table" style="margin-bottom: 8px;">
            <tr>
                <th>Date de début</th>
                <th>Date de fin</th>
                <th>Durée</th>
                <th>Tarif journalier</th>
            </tr>
            <tr>
                <td>{{ $start->format('d/m/Y') }}</td>
                <td>{{ $end->format('d/m/Y') }}</td>
                <td>{{ $days }} jour{{ $days > 1 ? 's' : '' }}</td>
                <td>{{ number_format($rental->daily_rate, 2, ',', ' ') }} MAD</td>
            </tr>
        </table>

        <table class="amount-table">
            <tr>
                <th>Montant total</th>
                <th>Caution versée</th>
                <th>Montant payé</th>
                <th>Reste à régler</th>
            </tr>
            <tr class="total-row">
                <td>{{ number_format($rental->total_price, 2, ',', ' ') }} MAD</td>
                <td>{{ number_format($rental->deposit_amount, 2, ',', ' ') }} MAD</td>
                <td>{{ number_format($rental->paid_amount, 2, ',', ' ') }} MAD</td>
                <td>{{ number_format($remaining, 2, ',', ' ') }} MAD</td>
            </tr>
        </table>
    </div>

    @if($rental->notes)
    <hr class="divider">
    <div class="section">
        <div class="section-title">Observations</div>
        <div class="notes-box">{{ $rental->notes }}</div>
    </div>
    @endif

    <hr class="divider">

    {{-- ═══ SIGNATURES ═══ --}}
    <div class="section">
        <div class="section-title">Signatures des parties</div>
        <table class="info-table">
            <tr>
                <td width="47%">
                    <span class="label">Signature du loueur</span>
                    <div class="signature-line"></div>
                    <div class="signature-label">{{ $rental->company->name ?? 'FleetRental' }}</div>
                </td>
                <td width="6%"></td>
                <td width="47%">
                    <span class="label">Signature du locataire</span>
                    <div class="signature-line"></div>
                    <div class="signature-label">{{ $rental->customer_name }}</div>
                </td>
            </tr>
        </table>
    </div>

    {{-- ═══ PIED DE PAGE ═══ --}}
    <div class="footer">
        <div class="footer-inner">
            <span>Généré le {{ now()->format('d/m/Y à H:i') }}</span>
            <span>FleetRental — Système de gestion de flotte</span>
            <span>Contrat n° {{ str_pad($rental->id, 6, '0', STR_PAD_LEFT) }}</span>
        </div>
    </div>

</body>
</html>
