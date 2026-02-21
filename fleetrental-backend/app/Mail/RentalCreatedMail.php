<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RentalCreatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly array $rentalData
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🚗 Nouvelle location créée — ' . $this->rentalData['vehicle'],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.rental_created',
        );
    }
}
