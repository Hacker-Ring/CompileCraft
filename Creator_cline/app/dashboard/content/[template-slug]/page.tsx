"use client"
import React, { useContext, useState } from 'react'
import FormSection from '../_components/FormSection'
import OutputSection from '../_components/OutputSection'
import { TEMPLATE } from '../../_components/TemplateListSection'
import Templates from '@/app/(data)/Templates'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Copy } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/utils/db'
import { AIOutput } from '@/utils/schema'
import { RoomProvider } from '@/liveblocks.config'
import { CollaborativeEditor } from '@/components/CollaborativeEditor'
import moment from 'moment'
import { TotalUsageContext } from '@/app/(context)/TotalUsageContext'
import { useRouter } from 'next/navigation'
import { UserSubscriptionContext } from '@/app/(context)/UserSubscriptionContext'
import { UpdateCreditUsageContext } from '@/app/(context)/UpdateCreditUsageContext'
import { useUser } from '@clerk/nextjs'

interface PROPS{
    params:{
        'template-slug':string
    }
}


function CreateNewContent(props:PROPS) {
   
    const selectedTemplate:TEMPLATE|undefined=Templates?.find((item)=>item.slug==props.params['template-slug']);
    const [loading,setLoading]=useState(false);
    const [aiOutput,setAiOutput]=useState<string>('');
    const {user}=useUser();
    const router=useRouter();
    const {totalUsage,setTotalUsage}=useContext(TotalUsageContext)
    const {userSubscription,setUserSubscription}=useContext(UserSubscriptionContext);
    const {updateCreditUsage,setUpdateCreditUsage}=useContext(UpdateCreditUsageContext)
    
    // Generate a shared room ID for this template - same for all users
    const roomId = `template-${props.params['template-slug']}`;
    /**
     * Used to generate content from AI
     * @param formData 
     * @returns 
     */
    const GenerateAIContent=async(formData:any)=>{
        if(totalUsage>=10000&&!userSubscription)
            {
                console.log("Please Upgrade");
                router.push('/dashboard/billing')
                return ;
            }
        setLoading(true);
        const SelectedPrompt=selectedTemplate?.aiPrompt;
        const FinalAIPrompt=JSON.stringify(formData)+", "+SelectedPrompt;
        try {
            const response = await fetch('/api/generate-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: FinalAIPrompt })
            });
            
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            setAiOutput(data.text);
            await SaveInDb(JSON.stringify(formData),selectedTemplate?.slug,data.text)
        } catch (error) {
            console.error('Content generation failed:', error);
            setAiOutput('Failed to generate content. Please try again.');
        }
        setLoading(false); 
        
        setUpdateCreditUsage(Date.now())

    }

    const SaveInDb=async(formData:any,slug:any,aiResp:string)=>{
        const result=await db.insert(AIOutput).values({
            formData:formData,
            templateSlug:slug,
            aiResponse:aiResp,
            createdBy:user?.primaryEmailAddress?.emailAddress,
            createdAt:moment().format('DD/MM/yyyy'),
        });

        console.log(result);
    }
    

  return (
    <div className='p-5'>
        <div className='mb-5'>
            <h1 className='text-2xl font-bold'>{selectedTemplate?.name}</h1>
            <p className='text-gray-600'>{selectedTemplate?.desc}</p>
        </div>
        
        {/* Form and Result Section - Side by Side */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5 mb-5'>
            {/* FormSection - Always show */}
            <FormSection 
                selectedTemplate={selectedTemplate}
                userFormInput={(v:any)=>GenerateAIContent(v)}
                loading={loading} 
            />
            
            {/* AI Result Section */}
            <div className='bg-white shadow-lg border rounded-lg'>
                <div className='flex justify-between items-center p-5'>
                    <h2 className='font-medium text-lg'>Your Result</h2>
                    {aiOutput && (
                        <Button className='flex gap-2'
                        onClick={()=>navigator.clipboard.writeText(aiOutput)}
                        ><Copy className='w-4 h-4'/> Copy </Button>
                    )}
                </div>
                <div className='p-5'>
                    {aiOutput ? (
                        <div className='bg-gray-50 p-4 rounded-lg border'>
                            <pre className='whitespace-pre-wrap text-sm'>{aiOutput}</pre>
                        </div>
                    ) : (
                        <div className='bg-gray-50 p-4 rounded-lg border'>
                            <p className='text-gray-500'>Your AI-generated content will appear here...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Collaborative Editor Section - Full Width Below */}
        <div className='bg-white shadow-lg border rounded-lg'>
            <div className='p-5 pb-3'>
                <h3 className='font-medium text-lg'>Collaborative Editor</h3>
                <p className='text-sm text-gray-600'>
                    {aiOutput 
                        ? 'Edit and collaborate with others in real-time. Content will be automatically synced.' 
                        : 'Generate content above to start collaborating'
                    }
                </p>
            </div>
            <div className='p-5'>
                <RoomProvider id={roomId} initialPresence={{ cursor: null }}>
                    <CollaborativeEditor 
                        roomId={roomId} 
                        initialContent={aiOutput}
                    />
                </RoomProvider>
            </div>
        </div>
    </div>
  )
}

export default CreateNewContent
