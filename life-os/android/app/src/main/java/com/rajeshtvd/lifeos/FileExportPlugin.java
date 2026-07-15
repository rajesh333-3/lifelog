package com.rajeshtvd.lifeos;

import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;

/**
 * Minimal Java file export plugin — writes a UTF-8 string to the app cache
 * and opens Android's share sheet directly, bypassing the Kotlin/coroutine
 * ionfilesystemlib that crashes due to D8 Kotlin-metadata corruption.
 */
@CapacitorPlugin(name = "FileExport")
public class FileExportPlugin extends Plugin {

    @PluginMethod
    public void writeAndShare(PluginCall call) {
        String filename    = call.getString("filename");
        String data        = call.getString("data");
        String dialogTitle = call.getString("dialogTitle", "Save backup");

        if (filename == null || data == null) {
            call.reject("filename and data are required");
            return;
        }

        try {
            // Write to app cache — no permissions needed, simple Java I/O.
            File file = new File(getContext().getCacheDir(), filename);
            Writer writer = new OutputStreamWriter(new FileOutputStream(file), "UTF-8");
            writer.write(data);
            writer.flush();
            writer.close();

            // Expose via FileProvider so other apps can read it.
            Uri contentUri = FileProvider.getUriForFile(
                getActivity(),
                getContext().getPackageName() + ".fileprovider",
                file
            );

            // Build a clean ACTION_SEND intent for the JSON file.
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("application/json");
            send.putExtra(Intent.EXTRA_STREAM, contentUri);
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooser = Intent.createChooser(send, dialogTitle);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(chooser);

            // Delete the cached file after 60 s — long enough for any upload to start.
            final File toDelete = file;
            new Handler(Looper.getMainLooper()).postDelayed(
                () -> toDelete.delete(), 60_000
            );

            call.resolve();
        } catch (Exception e) {
            call.reject("Export failed: " + e.getMessage());
        }
    }
}
