package es.obragis.campokml;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(InboxPlugin.class);
        super.onCreate(savedInstanceState);
        // Permite leer las coordenadas GPS originales de las fotos que se comparten con la app
        if (Build.VERSION.SDK_INT >= 29
            && ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_MEDIA_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[] { Manifest.permission.ACCESS_MEDIA_LOCATION }, 7);
        }
    }
}
