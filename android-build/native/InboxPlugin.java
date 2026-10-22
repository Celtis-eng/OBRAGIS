package es.obragis.campokml;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Recibe los ficheros que llegan desde otras apps ("Abrir con" y "Compartir")
 * y los entrega a la parte web de Campo KML.
 */
@CapacitorPlugin(name = "Inbox")
public class InboxPlugin extends Plugin {

    private static final String CONSUMED = "campokml_consumed";
    private final List<JSObject> pending = new ArrayList<>();

    @Override
    public void load() {
        collect(getActivity().getIntent());
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        if (collect(intent) > 0) {
            notifyListeners("files", new JSObject(), true);
        }
    }

    @PluginMethod
    public void take(PluginCall call) {
        JSArray arr = new JSArray();
        synchronized (pending) {
            for (JSObject o : pending) arr.put(o);
            pending.clear();
        }
        JSObject ret = new JSObject();
        ret.put("files", arr);
        call.resolve(ret);
    }

    @SuppressWarnings("deprecation")
    private int collect(Intent intent) {
        if (intent == null || intent.getBooleanExtra(CONSUMED, false)) return 0;
        String action = intent.getAction();
        List<Uri> uris = new ArrayList<>();
        if (Intent.ACTION_VIEW.equals(action) && intent.getData() != null) {
            uris.add(intent.getData());
        } else if (Intent.ACTION_SEND.equals(action)) {
            Uri u = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (u != null) uris.add(u);
        } else if (Intent.ACTION_SEND_MULTIPLE.equals(action)) {
            ArrayList<Uri> list = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
            if (list != null) uris.addAll(list);
        }
        if (uris.isEmpty()) return 0;
        intent.putExtra(CONSUMED, true);

        int n = 0;
        for (Uri uri : uris) {
            try {
                byte[] data = readAll(uri);
                if (data == null) continue;
                JSObject o = new JSObject();
                o.put("name", displayName(uri));
                String type = getContext().getContentResolver().getType(uri);
                if (type == null) type = intent.getType();
                o.put("mime", type != null ? type : "");
                o.put("b64", Base64.encodeToString(data, Base64.NO_WRAP));
                synchronized (pending) {
                    pending.add(o);
                }
                n++;
            } catch (Exception e) {
                // fichero ilegible: se ignora
            }
        }
        return n;
    }

    private byte[] readAll(Uri uri) throws Exception {
        Uri source = uri;
        // Para fotos de la galería, pide el original con las coordenadas GPS (Android 10+)
        if (Build.VERSION.SDK_INT >= 29 && "media".equals(uri.getAuthority())) {
            try {
                source = MediaStore.setRequireOriginal(uri);
                InputStream test = getContext().getContentResolver().openInputStream(source);
                if (test != null) test.close();
            } catch (Exception e) {
                source = uri;
            }
        }
        try (InputStream in = getContext().getContentResolver().openInputStream(source)) {
            if (in == null) return null;
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[65536];
            int r;
            while ((r = in.read(buf)) != -1) out.write(buf, 0, r);
            return out.toByteArray();
        }
    }

    private String displayName(Uri uri) {
        String name = null;
        if ("content".equals(uri.getScheme())) {
            try (Cursor c = getContext().getContentResolver().query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
                if (c != null && c.moveToFirst()) name = c.getString(0);
            } catch (Exception ignored) {}
        }
        if (name == null) name = uri.getLastPathSegment();
        return name != null ? name : "archivo";
    }
}
