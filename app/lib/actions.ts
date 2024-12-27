'use server';
 
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string()
})

const CreateInvoice = FormSchema.omit({ id: true, date: true});

export async function createInvoice(formData: FormData) {
  // const rawFormData = Object.fromEntries(formData.entries());
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  // Storing values in cents
  const amountInCents = amount * 100;
  // create a new date with the format "YYYY-MM-DD"
  const date = new Date().toISOString().split('T')[0];
  try {
    // inserting the data into your database
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date) 
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
  } catch(error) {
    return {
      message: 'Database Error: Faild to create invoice'
    };
  }

  // revalidating the cache
  revalidatePath('/dashboard/invoices');
  // redirect
  redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch(error) {
    return {
      message: 'Database Error: Faild to update invoice'
    };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {

  // throw new Error('Failed to Delete Invoice');
  
  try {
    await sql`
      DELETE FROM invoices
      WHERE id = ${id}
    `;
    // Since this action is being called in the `/dashboard/invoices` path,
    // you don't need to call redirect. Calling revalidatePath will trigger a new server request and re-render the table.
    revalidatePath('/dashboard/invoices');
    return { message: 'Delete Invoice.' };
  } catch(error) {
    return {
      message: 'Database Error: Faild to delete invoice.'
    };
  }
}