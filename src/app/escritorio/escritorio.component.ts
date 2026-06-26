import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QRCodeComponent } from 'angularx-qrcode';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, 
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonList, IonBadge, IonNote, IonText
} from '@ionic/angular/standalone';

interface RegistroAlta {
  _id: string;
  servicio: string;
  cuenta: string;
  fecha: Date | string; 
  estado: 'Pendiente' | 'Revocado' | 'Activo';
}

@Component({
  selector: 'app-escritorio',
  templateUrl: './escritorio.component.html',
  styleUrls: ['./escritorio.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, QRCodeComponent, DatePipe, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
    IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonInput, IonList, IonBadge, IonNote, IonText
  ]
})
export class EscritorioComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'https://backendqr-gray.vercel.app/api';

  servicioInput = signal<string>('Servicio Demo');
  cuentaInput = signal<string>('usuario@empresa.com');
  qrDataString = signal<string>('');
  registros = signal<RegistroAlta[]>([]);

  // Nuevas señales para manejar la activación desde el panel del QR
  registroActualId = signal<string>('');
  pinActual = signal<string>('');

  constructor() {}

  ngOnInit() {
    this.cargarRegistros();
  }

  cargarRegistros() {
    this.http.get<RegistroAlta[]>(`${this.apiUrl}/registros`).subscribe({
      next: (data) => this.registros.set(data),
      error: (err) => console.error('Error al cargar registros', err)
    });
  }

  generarQR() {
    const payload = {
      servicio: this.servicioInput(),
      cuenta: this.cuentaInput()
    };

    this.http.post<any>(`${this.apiUrl}/generar-alta`, payload).subscribe({
      next: (respuesta) => {
        this.qrDataString.set(respuesta.qr_uri);
        // Guardo el ID del registro recién creado
        this.registroActualId.set(respuesta.id); 
        this.cargarRegistros();
      },
      error: (err) => {
        console.error('Error al generar el QR', err);
        alert('Hubo un problema al conectar con el backend');
      }
    });
  }

  // Nuevo método adaptado para el QR activo
  activarRegistroActual() {
    const id = this.registroActualId();
    const pin = this.pinActual();

    if (!pin || pin.length !== 6) {
      alert('Necesito ingresar un PIN válido de 6 dígitos.');
      return;
    }

    const payload = { id: id, pin: pin };

    this.http.post<any>(`${this.apiUrl}/activar-alta`, payload).subscribe({
      next: (respuesta) => {
        if (respuesta.valido) {
          console.log('¡Activación exitosa!');
          // Limpio todo el panel del QR porque ya se activó con éxito
          this.pinActual.set('');
          this.qrDataString.set('');
          this.registroActualId.set('');
          this.cargarRegistros(); 
        }
      },
      error: (err) => {
        console.error('Error en la activación', err);
        alert('El código ingresado es incorrecto o ya cambió en la app móvil. Intento con el nuevo.');
      }
    });
  }

  revocarRegistro(id: string) {
    this.http.put(`${this.apiUrl}/revocar/${id}`, {}).subscribe({
      next: () => {
        console.log('Registro revocado');
        this.cargarRegistros();
      },
      error: (err) => console.error('Error al revocar', err)
    });
  }

  eliminarRegistro(id: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      this.http.delete(`${this.apiUrl}/eliminar/${id}`).subscribe({
        next: () => {
          console.log('Registro eliminado');
          this.cargarRegistros();
        },
        error: (err) => console.error('Error al eliminar', err)
      });
    }
  }
}
