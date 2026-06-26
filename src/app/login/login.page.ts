import { Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { logInOutline, mailOutline, lockClosedOutline } from 'ionicons/icons';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, 
  IonIcon, IonText
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    FormsModule, 
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, 
    IonIcon, IonText
  ]
})
export class LoginPage {
  // Inyecto el cliente HTTP apuntando a mi Flask local
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api';

  // Controlo los inputs con Signals
  cuentaInput = signal<string>('');
  pinInput = signal<string>('');
  
  // Manejo las alertas de error/éxito
  mensaje = signal<{texto: string, tipo: 'success' | 'danger'} | null>(null);

  constructor() {
    addIcons({ logInOutline, mailOutline, lockClosedOutline });
  }

  validarAcceso() {
    // Validación rápida para que no mande peticiones vacías
    if (!this.cuentaInput() || !this.pinInput()) {
      this.mensaje.set({ texto: 'Faltan datos, necesito llenar ambos campos.', tipo: 'danger' });
      return;
    }

    const payload = {
      cuenta: this.cuentaInput(),
      pin: this.pinInput()
    };

    // Le pego a mi backend
    this.http.post<any>(`${this.apiUrl}/validar-pin`, payload).subscribe({
      next: (respuesta) => {
        if (respuesta.valido) {
          this.mensaje.set({ texto: '¡Autenticación exitosa! Acceso permitido.', tipo: 'success' });
          // Aquí metería mi redirección al dashboard principal con el Router
        } else {
          this.mensaje.set({ texto: respuesta.mensaje, tipo: 'danger' });
        }
      },
      error: (err) => {
        console.error('Error al intentar validar el PIN', err);
        // Si el backend me regresa un 401, muestro este mensaje
        this.mensaje.set({ texto: 'El PIN es incorrecto o ya expiró. Intento con el nuevo.', tipo: 'danger' });
      }
    });
  }
}