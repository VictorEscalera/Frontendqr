import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { scanOutline, trashOutline, timeOutline, shieldHalfOutline } from 'ionicons/icons';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon, 
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, 
  IonList, IonButton, IonProgressBar, IonText, IonButtons } from '@ionic/angular/standalone';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { RouterLink } from '@angular/router';
import * as OTPAuth from 'otpauth';

// Interfaz para las cuentas guardadas en la app móvil
interface CuentaGuardada {
  id: string;
  issuer: string;
  label: string;
  secret: string;
  totpObj: OTPAuth.TOTP;
  currentPin: string;
}

@Component({
  selector: 'app-movil',
  templateUrl: './movil.component.html',
  styleUrls: ['./movil.component.scss'],
  standalone: true,
  imports: [IonButtons, RouterLink,
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonList, IonButton, IonProgressBar, IonText
  ]
})
export class MovilComponent implements OnInit, OnDestroy {
  cuentas = signal<CuentaGuardada[]>([]);
  progreso = signal<number>(0);
  
  private timerInterval: any;

  constructor() {
    addIcons({ scanOutline, trashOutline, timeOutline, shieldHalfOutline });
  }

  ngOnInit() {
    // Iniciamos el ciclo de vida de los códigos (30 segundos)
    this.iniciarTemporizador();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  async escanearQR() {
    try {
      // Solicitamos permisos de cámara
      const { camera } = await BarcodeScanner.requestPermissions();
      if (camera !== 'granted' && camera !== 'limited') {
        alert('Se necesitan permisos de cámara para escanear');
        return;
      }

      // Iniciamos el escaneo
      const { barcodes } = await BarcodeScanner.scan();
      
      if (barcodes.length > 0) {
        const uriEscaneada = barcodes[0].rawValue;
        
        // Validamos que realmente exista el texto para que TypeScript esté feliz
        if (uriEscaneada) {
          this.procesarURI(uriEscaneada);
        } else {
          alert('El código QR escaneado está vacío o no se pudo leer.');
        }
      }
    } catch (error) {
      console.error('Error al escanear:', error);
      alert('Hubo un error al intentar escanear el QR.');
    }
  }

  procesarURI(uri: string) {
    try {
      // Parseamos la URI estándar de authenticator (otpauth://totp/...)
      const parsedTOTP = OTPAuth.URI.parse(uri) as OTPAuth.TOTP;
      
      const nuevaCuenta: CuentaGuardada = {
        id: Math.random().toString(36).substr(2, 9),
        issuer: parsedTOTP.issuer || 'Servicio Desconocido',
        label: parsedTOTP.label || 'cuenta@desconocida.com',
        secret: parsedTOTP.secret.base32,
        totpObj: parsedTOTP,
        currentPin: parsedTOTP.generate()
      };

      // Agregamos la cuenta a nuestra lista
      this.cuentas.update(c => [...c, nuevaCuenta]);
      
    } catch (error) {
      console.error('URI inválida:', error);
      alert('El código QR no es válido para autenticación.');
    }
  }

  eliminarCuenta(id: string) {
    this.cuentas.update(c => c.filter(cuenta => cuenta.id !== id));
  }

  private iniciarTemporizador() {
    // Actualizamos los pines y la barra de progreso cada segundo
    this.timerInterval = setInterval(() => {
      const epoch = Math.floor(Date.now() / 1000);
      const segundosRestantes = 30 - (epoch % 30);
      
      // El progreso va de 1 a 0
      this.progreso.set(segundosRestantes / 30);

      // Si los segundos restantes son 30, significa que empezó un nuevo ciclo, actualizamos pines
      if (segundosRestantes === 30) {
        this.actualizarPines();
      }
    }, 1000);
  }

  private actualizarPines() {
    this.cuentas.update(cuentasActuales => {
      return cuentasActuales.map(cuenta => ({
        ...cuenta,
        currentPin: cuenta.totpObj.generate()
      }));
    });
  }
}