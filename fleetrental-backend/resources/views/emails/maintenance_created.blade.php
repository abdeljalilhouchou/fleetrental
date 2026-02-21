<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle maintenance</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; color: #1e293b; }
        .wrapper { max-width: 600px; margin: 32px auto; }
        .header { background: linear-gradient(135deg, #d97706, #f59e0b); border-radius: 12px 12px 0 0; padding: 32px 40px; text-align: center; }
        .header h1 { color: #fff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { color: #fef3c7; font-size: 14px; margin-top: 6px; }
        .badge { display: inline-block; background: #fff; color: #d97706; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 99px; margin-top: 14px; }
        .body { background: #fff; padding: 36px 40px; }
        .section-title { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; margin-top: 28px; }
        .section-title:first-child { margin-top: 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
        .field-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .field-value { font-size: 14px; color: #1e293b; font-weight: 600; }
        .field-value.orange { color: #d97706; }
        .field-value.red { color: #dc2626; }
        .field.full { grid-column: 1 / -1; }
        .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
        .summary-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 20px 24px; margin-top: 20px; }
        .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 14px; color: #475569; }
        .summary-row.total { font-size: 16px; font-weight: 700; color: #1e293b; border-top: 1px solid #fde68a; margin-top: 8px; padding-top: 12px; }
        .summary-row.total span:last-child { color: #d97706; }
        .footer { background: #f8fafc; border-radius: 0 0 12px 12px; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { font-size: 12px; color: #94a3b8; line-height: 1.6; }
        .footer strong { color: #64748b; }
    </style>
</head>
<body>
<div class="wrapper">

    {{-- Header --}}
    <div class="header">
        <h1>🔧 FleetRental</h1>
        <p>Système de gestion de flotte automobile</p>
        <span class="badge">⚠ Nouvelle maintenance créée</span>
    </div>

    {{-- Body --}}
    <div class="body">

        {{-- Véhicule --}}
        <div class="section-title">Véhicule</div>
        <div class="grid">
            <div class="field">
                <div class="field-label">Véhicule</div>
                <div class="field-value orange">{{ $data['vehicle'] }}</div>
            </div>
            <div class="field">
                <div class="field-label">Immatriculation</div>
                <div class="field-value">{{ $data['registration'] }}</div>
            </div>
        </div>

        {{-- Maintenance --}}
        <div class="section-title">Détails de la maintenance</div>
        <div class="grid">
            <div class="field">
                <div class="field-label">Type</div>
                <div class="field-value orange">{{ $data['type'] }}</div>
            </div>
            <div class="field">
                <div class="field-label">Date</div>
                <div class="field-value">{{ $data['date'] }}</div>
            </div>
            <div class="field">
                <div class="field-label">Kilométrage</div>
                <div class="field-value">{{ number_format($data['mileage']) }} km</div>
            </div>
            <div class="field">
                <div class="field-label">Coût</div>
                <div class="field-value red">{{ number_format($data['cost'], 2) }} MAD</div>
            </div>
        </div>

        @if($data['description'])
        <hr class="divider">
        <div class="section-title">Description</div>
        <div class="field full">
            <div class="field-value" style="font-weight:400; color:#475569;">{{ $data['description'] }}</div>
        </div>
        @endif

    </div>

    {{-- Footer --}}
    <div class="footer">
        <p>
            Cet email a été envoyé automatiquement par <strong>FleetRental</strong>.<br>
            Créé le {{ $data['created_at'] }} · Entreprise : <strong>{{ $data['company'] }}</strong>
        </p>
    </div>

</div>
</body>
</html>
