<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle location</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; color: #1e293b; }
        .wrapper { max-width: 600px; margin: 32px auto; }
        .header { background: linear-gradient(135deg, #1e40af, #2563eb); border-radius: 12px 12px 0 0; padding: 32px 40px; text-align: center; }
        .header h1 { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { color: #bfdbfe; font-size: 14px; margin-top: 6px; }
        .badge { display: inline-block; background: #22c55e; color: #fff; font-size: 12px; font-weight: 600; padding: 4px 14px; border-radius: 99px; margin-top: 14px; }
        .body { background: #fff; padding: 36px 40px; }
        .section-title { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; margin-top: 28px; }
        .section-title:first-child { margin-top: 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
        .field-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .field-value { font-size: 14px; color: #1e293b; font-weight: 600; }
        .field-value.green { color: #16a34a; }
        .field-value.blue { color: #2563eb; }
        .field.full { grid-column: 1 / -1; }
        .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
        .summary-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 20px 24px; margin-top: 20px; }
        .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 14px; color: #475569; }
        .summary-row.total { font-size: 16px; font-weight: 700; color: #1e293b; border-top: 1px solid #bfdbfe; margin-top: 8px; padding-top: 12px; }
        .summary-row.total span:last-child { color: #2563eb; }
        .footer { background: #f8fafc; border-radius: 0 0 12px 12px; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { font-size: 12px; color: #94a3b8; line-height: 1.6; }
        .footer strong { color: #64748b; }
    </style>
</head>
<body>
<div class="wrapper">

    {{-- Header --}}
    <div class="header">
        <h1>🚗 FleetRental</h1>
        <p>Système de gestion de flotte automobile</p>
        <span class="badge">✓ Nouvelle location créée</span>
    </div>

    {{-- Body --}}
    <div class="body">

        {{-- Véhicule --}}
        <div class="section-title">Véhicule</div>
        <div class="grid">
            <div class="field">
                <div class="field-label">Véhicule</div>
                <div class="field-value blue">{{ $rentalData['vehicle'] }}</div>
            </div>
            <div class="field">
                <div class="field-label">Immatriculation</div>
                <div class="field-value">{{ $rentalData['registration'] }}</div>
            </div>
        </div>

        {{-- Client --}}
        <div class="section-title">Client</div>
        <div class="grid">
            <div class="field">
                <div class="field-label">Nom</div>
                <div class="field-value">{{ $rentalData['customer_name'] }}</div>
            </div>
            <div class="field">
                <div class="field-label">Téléphone</div>
                <div class="field-value">{{ $rentalData['customer_phone'] }}</div>
            </div>
            @if($rentalData['customer_email'])
            <div class="field full">
                <div class="field-label">Email</div>
                <div class="field-value">{{ $rentalData['customer_email'] }}</div>
            </div>
            @endif
        </div>

        {{-- Période --}}
        <div class="section-title">Période de location</div>
        <div class="grid">
            <div class="field">
                <div class="field-label">Date de début</div>
                <div class="field-value">{{ $rentalData['start_date'] }}</div>
            </div>
            <div class="field">
                <div class="field-label">Date de fin</div>
                <div class="field-value">{{ $rentalData['end_date'] }}</div>
            </div>
            <div class="field">
                <div class="field-label">Durée</div>
                <div class="field-value">{{ $rentalData['days'] }} jour(s)</div>
            </div>
            <div class="field">
                <div class="field-label">Kilométrage départ</div>
                <div class="field-value">{{ number_format($rentalData['start_mileage']) }} km</div>
            </div>
        </div>

        {{-- Récap financier --}}
        <div class="summary-box">
            <div class="summary-row">
                <span>Tarif journalier</span>
                <span>{{ number_format($rentalData['daily_rate'], 2) }} MAD</span>
            </div>
            <div class="summary-row">
                <span>Durée</span>
                <span>× {{ $rentalData['days'] }} jour(s)</span>
            </div>
            <div class="summary-row">
                <span>Caution</span>
                <span>{{ number_format($rentalData['deposit'], 2) }} MAD</span>
            </div>
            <div class="summary-row">
                <span>Déjà payé</span>
                <span class="green">{{ number_format($rentalData['paid'], 2) }} MAD</span>
            </div>
            <div class="summary-row total">
                <span>Total location</span>
                <span>{{ number_format($rentalData['total'], 2) }} MAD</span>
            </div>
        </div>

        @if($rentalData['notes'])
        <hr class="divider">
        <div class="section-title">Notes</div>
        <div class="field full">
            <div class="field-value" style="font-weight:400; color:#475569;">{{ $rentalData['notes'] }}</div>
        </div>
        @endif

    </div>

    {{-- Footer --}}
    <div class="footer">
        <p>
            Cet email a été envoyé automatiquement par <strong>FleetRental</strong>.<br>
            Créé le {{ $rentalData['created_at'] }} · Entreprise : <strong>{{ $rentalData['company'] }}</strong>
        </p>
    </div>

</div>
</body>
</html>
