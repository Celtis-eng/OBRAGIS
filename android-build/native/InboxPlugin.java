package es.obragis.campokml;

import android.app.Activity;
import android.content.Intent;
import android.provider.DocumentsContract;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
import java.io.File;
import java.io.FileOutputStream;
import java.util.Locale;
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

    /* ---- Elegir una carpeta entera (Importar → «Una carpeta») ----
       Android no deja leer carpetas desde la web: se elige con el selector de Android, se copian a la caché de la app
       los ficheros que interesan (planos, fotos, .zip y BC3, también en subcarpetas) y la web los lee de ahí. */
    private static final int MAX_FILES = 1500;
    private static final int MAX_DEPTH = 6;

    @PluginMethod
    public void pickFolder(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        startActivityForResult(call, i, "folderResult");
    }

    @ActivityCallback
    private void folderResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            JSObject r = new JSObject();
            r.put("files", new JSArray());
            r.put("cancelled", true);
            call.resolve(r);
            return;
        }
        final Uri tree = result.getData().getData();
        new Thread(() -> {
            try {
                File dir = folderCache();
                deleteRec(dir);
                dir.mkdirs();
                JSArray arr = new JSArray();
                String rootId = DocumentsContract.getTreeDocumentId(tree);
                walk(tree, rootId, "", dir, arr, 0);
                JSObject r = new JSObject();
                r.put("files", arr);
                call.resolve(r);
            } catch (Exception e) {
                call.reject("No se pudo leer la carpeta: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void clearFolder(PluginCall call) {
        deleteRec(folderCache());
        call.resolve();
    }

    private File folderCache() {
        return new File(getContext().getCacheDir(), "importar_carpeta");
    }

    private void deleteRec(File f) {
        if (f == null || !f.exists()) return;
        File[] list = f.listFiles();
        if (list != null) for (File c : list) deleteRec(c);
        f.delete();
    }

    private static boolean wanted(String name) {
        String n = name.toLowerCase(Locale.ROOT);
        return n.endsWith(".kml") || n.endsWith(".kmz") || n.endsWith(".zip") || n.endsWith(".bc3")
            || n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".png") || n.endsWith(".webp");
    }

    private void walk(Uri tree, String docId, String rel, File outDir, JSArray arr, int depth) throws Exception {
        if (depth > MAX_DEPTH || arr.length() >= MAX_FILES) return;
        Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(tree, docId);
        String[] cols = { DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME, DocumentsContract.Document.COLUMN_MIME_TYPE };
        try (Cursor c = getContext().getContentResolver().query(children, cols, null, null, null)) {
            if (c == null) return;
            while (c.moveToNext() && arr.length() < MAX_FILES) {
                String id = c.getString(0), name = c.getString(1), mime = c.getString(2);
                if (name == null || name.startsWith(".")) continue;
                if (DocumentsContract.Document.MIME_TYPE_DIR.equals(mime)) {
                    walk(tree, id, rel + name + "/", outDir, arr, depth + 1);
                } else if (wanted(name)) {
                    Uri doc = DocumentsContract.buildDocumentUriUsingTree(tree, id);
                    File dest = new File(outDir, (arr.length() + 1) + "_" + name.replaceAll("[\\/:*?\"<>|]", "_"));
                    try (InputStream in = getContext().getContentResolver().openInputStream(doc); FileOutputStream out = new FileOutputStream(dest)) {
                        if (in == null) continue;
                        byte[] buf = new byte[65536];
                        int r;
                        while ((r = in.read(buf)) != -1) out.write(buf, 0, r);
                    } catch (Exception e) {
                        continue; // fichero ilegible: se salta
                    }
                    JSObject o = new JSObject();
                    o.put("name", name);
                    o.put("rel", rel + name);
                    o.put("mime", mime != null ? mime : "");
                    o.put("path", dest.getAbsolutePath());
                    arr.put(o);
                }
            }
        }
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
