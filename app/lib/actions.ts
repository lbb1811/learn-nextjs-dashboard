'use server';
 
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if(error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin': return 'Invalid credentials.';
        default: return 'Something went wrong.';
      }
    }
    throw error;
  }
}

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer'
  }),
  amount: z.coerce.number().gt(0, 'Amount must be greater than 0'),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.'
  }),
  date: z.string()
})

const CreateInvoice = FormSchema.omit({ id: true, date: true});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
}

export async function createInvoice(prevState: State, formData: FormData) {
  const validateFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if(!validateFields.success) {
    return {
      errors: validateFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.'
    };
  }
  
  const { customerId, amount, status } = validateFields.data;
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

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  const validateFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if(!validateFields.success) {
    return {
      errors: validateFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.'
    };
  }

  const { customerId, amount, status } = validateFields.data;
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
    // return { message: 'Delete Invoice.' };
  } catch(error) {
    // return {
    //   message: 'Database Error: Faild to delete invoice.'
    // };
    throw error;
  }
}